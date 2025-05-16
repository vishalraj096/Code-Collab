import { atom } from "recoil";
import { recoilPersist } from "recoil-persist";

const { persistAtom } = recoilPersist();

export interface UserState {
  name: string | null;
  id: string | null;
}

export const userState = atom<UserState>({
  key: "user-state",
  default: { name: null, id: null },
  effects_UNSTABLE: [persistAtom],
});
