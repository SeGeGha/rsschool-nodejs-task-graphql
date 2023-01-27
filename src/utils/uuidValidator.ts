import { UUID_REGEX } from '../regex';

export const validateId = (id: string) => id.match(UUID_REGEX);
