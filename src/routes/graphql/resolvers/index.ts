import {
  getUsers, getUsersWithInfo, getUser, getUserWithInfo
} from './user';
import { getProfiles, getProfile } from './profile';
import { getPosts, getPost } from './post';
import { getMemberTypes, getMemberType } from './memberType';

export const resolvers = {
  getUsers,
  getUser,
  getUsersWithInfo,
  getUserWithInfo,

  getProfiles,
  getProfile,

  getPosts,
  getPost,

  getMemberTypes,
  getMemberType,
};
