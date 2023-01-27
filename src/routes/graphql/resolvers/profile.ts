import { FastifyInstance } from 'fastify';

export const getProfiles = async (args: any, fastify: FastifyInstance) => {
  return fastify.db.profiles.findMany();
};

export const getProfile = async (args: Record<'id', string>, fastify: FastifyInstance) => {
  return fastify.db.profiles.findOne({ key: 'id', equals: args.id });
};

export const getUserProfile = (args: Record<'id', string>, fastify: FastifyInstance) => {
  return fastify.db.profiles.findOne({ key: 'userId', equals: args.id });
};
