/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandOptionType } from "@api/Commands";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "FakeForwardText",
    description: "Sends a message formatted to look like a forwarded message.",
    authors: [{ name: "imnotcraftyy", id: 888529372443713626n }],
    tags: ["Chat", "Fun"],

    commands: [{
        name: "fakeforward",
        description: "Send a fake forwarded text message",
        options: [
            {
                name: "text",
                description: "The text you want to fake-forward",
                type: ApplicationCommandOptionType.STRING,
                required: true
            }
        ],
        execute(args, ctx) {
            const text = args.find(a => a.name === "text")?.value as string;
            
            if (!text) return;


            const formattedLines = text
                .split("\\n") 
                .map(line => `> ### ${line.trim()}`)
                .join("\n");

            const forwardedMessage = `> -# ↪  ***Forwarded***\n${formattedLines}`;

            return {
                content: forwardedMessage
            };
        }
    }]
});
