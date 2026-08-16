/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { BadgePosition, ProfileBadge } from "@api/Badges";
import { definePluginSettings } from "@api/Settings";
import definePlugin, { OptionType } from "@utils/types";
import { GuildMemberStore, GuildRoleStore, GuildStore, PermissionsBits, SelectedGuildStore, Tooltip, UserStore } from "@webpack/common";

const TIER_DEFINITIONS = [
    { id: "gold", label: "Owner", color: "#f1c40f" },
    { id: "silver", label: "Administrator", color: "#c0c7d1" },
    { id: "bronze", label: "Moderator", color: "#cd7f32" }
] as const;

type Tier = typeof TIER_DEFINITIONS[number];

const settings = definePluginSettings({
    ignoreBots: {
        type: OptionType.BOOLEAN,
        description: "Do not add staff crowns to bots",
        default: true
    },
    showInMemberList: {
        type: OptionType.BOOLEAN,
        description: "Show crowns in the member list",
        default: true
    },
    showInProfiles: {
        type: OptionType.BOOLEAN,
        description: "Show crowns as profile badges",
        default: true
    }
});

function getGuildPermissions(userId: string, guildId: string): bigint {
    const member = GuildMemberStore.getMember(guildId, userId);
    if (!member) return 0n;

    const roleIds = new Set([guildId, ...member.roles]);
    let permissions = 0n;

    for (const roleId of roleIds) {
        const role = GuildRoleStore.getRole(guildId, roleId);
        if (role) permissions |= role.permissions;
    }

    return permissions;
}

function hasAnyPermission(permissions: bigint, bits: bigint[]): boolean {
    return bits.some(bit => (permissions & bit) === bit);
}

function getTier(userId: string, guildId?: string | null, isOwner = false): Tier | null {
    if (!guildId) return null;
    if (settings.store.ignoreBots && UserStore.getUser(userId)?.bot) return null;

    const owner = isOwner || GuildStore.getGuild(guildId)?.ownerId === userId;
    if (owner) return TIER_DEFINITIONS[0];

    const permissions = getGuildPermissions(userId, guildId);
    if ((permissions & PermissionsBits.ADMINISTRATOR) === PermissionsBits.ADMINISTRATOR)
        return TIER_DEFINITIONS[1];

    const managementPermissions = [
        PermissionsBits.MANAGE_GUILD,
        PermissionsBits.MANAGE_CHANNELS,
        PermissionsBits.MANAGE_THREADS,
        PermissionsBits.MANAGE_EVENTS,
        PermissionsBits.MANAGE_ROLES,
        PermissionsBits.MANAGE_MESSAGES,
        PermissionsBits.MODERATE_MEMBERS,
        PermissionsBits.KICK_MEMBERS,
        PermissionsBits.BAN_MEMBERS,
        PermissionsBits.MUTE_MEMBERS,
        PermissionsBits.DEAFEN_MEMBERS,
        PermissionsBits.MOVE_MEMBERS
    ];

    if (hasAnyPermission(permissions, managementPermissions))
        return TIER_DEFINITIONS[2];

    return null;
}

function CrownIcon({ color, profile = false }: { color: string; profile?: boolean; }) {
    const size = profile ? 18 : 14;

    return (
        <svg
            aria-hidden="true"
            className="vc-staff-crowns-icon"
            height={size}
            viewBox="0 0 24 24"
            width={size}
        >
            <path
                d="M3 7.2 7.4 11 12 4l4.6 7L21 7.2l-1.7 10.3H4.7L3 7.2Zm2.1 12.3h13.8V22H5.1v-2.5Z"
                fill={color}
                stroke="color-mix(in srgb, currentColor 45%, transparent)"
                strokeLinejoin="round"
                strokeWidth="0.7"
            />
        </svg>
    );
}

function Crown({ tier, profile = false }: { tier: Tier; profile?: boolean; }) {
    return (
        <Tooltip text={tier.label}>
            {tooltipProps => (
                <span
                    {...tooltipProps}
                    aria-label={tier.label}
                    className={`vc-staff-crowns vc-staff-crowns-${tier.id}${profile ? " vc-staff-crowns-profile" : ""}`}
                    role="img"
                >
                    <CrownIcon color={tier.color} profile={profile} />
                </span>
            )}
        </Tooltip>
    );
}

const profileBadge: ProfileBadge = {
    id: "vc-staff-crowns-profile-badge",
    key: "Staff Crown",
    position: BadgePosition.START,
    shouldShow: ({ userId, guildId }) => settings.store.showInProfiles && Boolean(getTier(userId, guildId)),
    component: ({ userId, guildId }) => {
        const tier = getTier(userId, guildId);
        return tier ? <Crown tier={tier} profile /> : null;
    }
};

export default definePlugin({
    name: "Staff Crowns",
    description: "Adds a Crown/Tag to Server Owners (or Admins/Management)",
    authors: [{ name: "NuzFlameV2", id: 1248366351194652712n },{ name: "ItsDenji777", id: 876433011866992680n}],
    settings,
    tags: ["Appearance", "Servers"],

    userProfileBadge: profileBadge,

    renderMemberListDecorator({ type, user, isOwner }) {
        // fix uwu: Added `|| !user` to prevent crashing when Discord renders loading placeholders
        if (!settings.store.showInMemberList || !user) return null;

        const guildId = type === "guild" ? SelectedGuildStore.getGuildId() : undefined;
        const tier = getTier(user.id, guildId, isOwner);
        return tier ? <Crown tier={tier} /> : null;
    }
});
