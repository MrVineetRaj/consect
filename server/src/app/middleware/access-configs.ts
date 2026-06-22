export const getChannelAccessConfig = (
  role: "admin" | "owner" | "member" | null,
) => {
  const isOwner = role == "owner";
  const isAdmin = role == "admin";
  return {
    removeMember: isOwner ? true : isAdmin ? true : false,
    inviteMember: isOwner ? true : isAdmin ? true : false,
    changeMemberConfig: isOwner ? true : isAdmin ? true : false,
    changeMemberRole: isOwner ? true : isAdmin ? false : false,
    aiHubRead: isOwner ? true : isAdmin ? true : false,
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
  };
};
