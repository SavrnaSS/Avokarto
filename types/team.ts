export type TeamSocialLink = {
  href: string;
  iconClassName: string;
};

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  image?: string;
  social?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export type TeamMemberWithImage = Omit<TeamMember, "image"> & { image: string };

export type TeamMemberWithSocial = TeamMemberWithImage & {
  socialLinks: TeamSocialLink[];
};

export type GradientTeamMember = TeamMemberWithImage & {
  subtitle: string;
  location: string;
  description: string;
  socialLinks: TeamSocialLink[];
};
