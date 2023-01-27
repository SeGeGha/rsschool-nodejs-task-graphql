import { FastifyInstance } from 'fastify';
import { getUserPosts } from './post';
import { getUserProfile } from './profile';
import { getMemberType } from './memberType';

export const getUserInfo = async (args: Record<'id', string>, fastify: FastifyInstance) => {
  const posts   = await getUserPosts(args, fastify);
  const profile = await getUserProfile(args, fastify);
  const memberType = (
    profile
      ? await getMemberType({ id: profile.memberTypeId }, fastify)
      : null
  );

  return { posts, profile, memberType };
};

export const getUsers = async (args: Object, fastify: FastifyInstance) => {
  return fastify.db.users.findMany();
};

export const getUsersWithInfo = async (args: Object, fastify: FastifyInstance) => {
  const usersWithInfo = [];

  for (const user of await getUsers(args, fastify)) {
    const userInfo = await getUserInfo({ id: user.id }, fastify);

    usersWithInfo.push({ ...user, ...userInfo });
  }

  return usersWithInfo;
};

export const getUser = async (args: Record<'id', string>, fastify: FastifyInstance) => {
    return fastify.db.users.findOne({ key: 'id', equals: args.id });
};

export const getUserWithInfo = async (args: Record<'id', string>, fastify: FastifyInstance) => {
  const user = await getUser(args, fastify);
  if (!user) return null;

  const userInfo = await getUserInfo(args, fastify);

  return { ...user, ...userInfo };
};
