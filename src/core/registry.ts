import type { Mode } from './mode';

const modes = new Map<string, Mode>();

export const register = (m: Mode) => modes.set(m.meta.id, m);
export const all = () => [...modes.values()];
export const get = (id: string) => modes.get(id);
