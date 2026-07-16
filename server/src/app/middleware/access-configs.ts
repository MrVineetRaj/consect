export const getChannelAccessConfig = (
  role: "admin" | "owner" | "member" | null,
) => {
  const isOwner = role == "owner";
  const isAdmin = role == "admin";
  return {
    removeMember: isOwner ? true : isAdmin ? true : false,
    // Everyone can invite by default; an override can still revoke it.
    inviteMember: true,
    changeMemberConfig: isOwner ? true : isAdmin ? true : false,
    changeMemberRole: isOwner ? true : isAdmin ? false : false,
  };
};

export const getOrganizationAccessConfig = (
  role: "admin" | "owner" | "member",
) => {
  const isOwner = role == "owner";
  const isAdmin = role == "admin";
  return {
    removeMember: isOwner ? true : isAdmin ? true : false,
    inviteMember: isOwner ? true : isAdmin ? true : false,
    changeMemberConfig: isOwner ? true : isAdmin ? true : false,
    changeMemberRole: isOwner ? true : isAdmin ? false : false,
    aiHubWrite: isOwner ? true : isAdmin ? true : false,
    // Everyone can create channels by default; an override can revoke it.
    createChannel: true,
  };
};
