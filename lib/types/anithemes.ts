export interface AnithemesSearchAnilistId {
  anime: {
    name: string;
    animethemes: {
      type: 'OP' | 'ED';
      song: {
        title: string;
        artists: {
          name: string;
        }[];
      };
      animethemeentries: {
        episodes: string;
        videos?: {
          link: string;
        }[];
      }[];
    }[];
  }[];
}

export interface ThemeObject {
  type: string;
  title: string;
  artists: string;
  episodes: string;
  videoUrl: string | null;
}
