import { FastifyInstance } from 'fastify';

export const getPosts = async (args: any, fastify: FastifyInstance) => {
  return fastify.db.posts.findMany();
};

export const getPost = async (args: Record<'id', string>, fastify: FastifyInstance) => {
  return fastify.db.posts.findOne({ key: 'id', equals: args.id });
};

export const getUserPosts = (args: Record<'id', string>, fastify: FastifyInstance) => {
  return fastify.db.posts.findMany({ key: 'userId', equals: args.id });
};
