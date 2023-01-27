import { FastifyInstance } from 'fastify';

export const getMemberTypes = async (args: any, fastify: FastifyInstance) => {
  return fastify.db.memberTypes.findMany();
};

export const getMemberType = async (args: Record<'id', string>, fastify: FastifyInstance) => {
  return fastify.db.memberTypes.findOne({ key: 'id', equals: args.id });
};
