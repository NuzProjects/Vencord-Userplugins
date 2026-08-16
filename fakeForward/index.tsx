/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ChatBarButton, ChatBarButtonFactory } from "@api/ChatButtons";
import { definePluginSettings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import definePlugin, { IconComponent, OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Constants, DraftStore, DraftType, RestAPI, showToast, Toasts, useState, useStateFromStores } from "@webpack/common";

const logger = new Logger("FakeForward");

const DraftManager = findByPropsLazy("clearDraft", "saveDraft");
const UploadStore = findByPropsLazy("getUploads");

const busyChannels = new Set<string>();

const settings = definePluginSettings({
    forwardMode: {
        type: OptionType.SELECT,
        description: "What type of ID are you providing?",
        options: [
            { label: "User ID (Sends via DM)", value: "USER" },
            { label: "Channel ID (Group DM or Server)", value: "CHANNEL" }
        ],
        default: "USER"
    },
    sourceId: {
        type: OptionType.STRING,
        displayName: "Target ID",
        description: "The User ID or Channel ID to use as the temporary forwarding source.",
        default: "1513317540519219261",
        placeholder: "1513317540519219261",
        isValid: (value: string) => /^\d{17,20}$/.test(value.trim()) || "Enter a valid Discord ID."
    }
});

const ForwardIcon: IconComponent = ({ height = 20, width = 20, className }) => (
    <svg
        aria-hidden="true"
        className={className}
        fill="none"
        height={height}
        viewBox="0 0 24 24"
        width={width}
    >
        <path
            d="M13 5 20 12 13 19M20 12H8a4 4 0 0 0-4 4v3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
        />
    </svg>
);

async function deleteSource(channelId: string, messageId: string) {
    await RestAPI.del({
        url: Constants.Endpoints.MESSAGE(channelId, messageId)
    });
}

async function getOrCreateSourceChannel() {
    const targetId = settings.store.sourceId.trim();

    if (settings.store.forwardMode === "CHANNEL") {
        return targetId;
    }

    const response = await RestAPI.post({
        url: "/users/@me/channels",
        body: { recipient_id: targetId }
    });

    return response.body.id as string;
}

async function sendAsForward(destinationChannelId: string, content: string, uploads: any[]) {
    let sourceChannelId: string | undefined;
    let sourceId: string | undefined;

    try {
        sourceChannelId = await getOrCreateSourceChannel();

        let body: any;
        if (uploads && uploads.length > 0) {
            body = new FormData();
            const payload: any = {};
            if (content && content.trim().length > 0) {
                payload.content = content;
            }
            if (Object.keys(payload).length > 0) {
                body.append("payload_json", JSON.stringify(payload));
            }
            uploads.forEach((upload, index) => {
                const file = upload.item?.file || upload.file || upload.item;
                const filename = upload.filename || upload.name || upload.item?.name || `file_${index}`;
                if (file) {
                    body.append(`files[${index}]`, file, filename);
                }
            });
        } else {
            body = { content };
        }

        const source = await RestAPI.post({
            url: Constants.Endpoints.MESSAGES(sourceChannelId),
            body
        });

        const createdSourceId = sourceId = source.body.id;

        await RestAPI.post({
            url: Constants.Endpoints.MESSAGES(destinationChannelId),
            body: {
                message_reference: {
                    type: 1,
                    message_id: createdSourceId,
                    channel_id: sourceChannelId
                }
            }
        });

        DraftManager.clearDraft(destinationChannelId, DraftType.ChannelMessage);
        if (UploadStore && typeof UploadStore.clearAll === "function") {
            UploadStore.clearAll(destinationChannelId, DraftType.ChannelMessage);
        }

        try {
            await deleteSource(sourceChannelId, createdSourceId);
        } catch (error) {
            logger.error("Forward sent, but the temporary source could not be deleted", error);
            showToast("Forward sent, but the temporary source message could not be deleted.", Toasts.Type.FAILURE);
        }
    } catch (error) {
        logger.error("Failed to create forward", error);

        if (sourceChannelId && sourceId) {
            try {
                await deleteSource(sourceChannelId, sourceId);
            } catch (deleteError) {
                logger.error("Failed to clean up the temporary source", deleteError);
            }
        }

        showToast("Could not create the forward. Your draft was kept.", Toasts.Type.FAILURE);
    }
}

const FakeForwardButton: ChatBarButtonFactory = ({ channel: { id: channelId }, isAnyChat }) => {
    const draft = useStateFromStores([DraftStore], () => DraftStore.getDraft(channelId, DraftType.ChannelMessage));
    const uploads = useStateFromStores(
        [UploadStore].filter(Boolean),
        () => (UploadStore && typeof UploadStore.getUploads === "function" ? UploadStore.getUploads(channelId, DraftType.ChannelMessage) : [])
    );
    const [busy, setBusy] = useState(() => busyChannels.has(channelId));

    if (!isAnyChat) return null;

    return (
        <ChatBarButton
            tooltip={busy ? "Creating forward…" : "FakeForward"}
            onClick={async () => {
                if (busyChannels.has(channelId)) return;

                if (!draft.length && (!uploads || uploads.length === 0)) {
                    showToast("Type something or attach a file first.", Toasts.Type.MESSAGE);
                    return;
                }

                busyChannels.add(channelId);
                setBusy(true);

                try {
                    await sendAsForward(channelId, draft, uploads);
                } finally {
                    busyChannels.delete(channelId);
                    setBusy(false);
                }
            }}
            buttonProps={{
                "aria-disabled": busy,
                style: { opacity: busy ? 0.5 : 1 }
            }}
        >
            <ForwardIcon />
        </ChatBarButton>
    );
};

export default definePlugin({
    name: "Fake Forward",
    description: "Send your chatbox text as a real forwarded message.",
    authors: [
        { name: "NuzFlameV2", id: 1248366351194652712n },
        { name: "ItsDenji777", id: 876433011866992680n }
    ],
    settings,

    chatBarButton: {
        icon: ForwardIcon,
        render: FakeForwardButton
    }
});
