import { GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql';
import { FastifyInstance } from 'fastify';

export const memberType = new GraphQLObjectType({
  name  : 'MemberType',
  fields: {
    id             : { type: GraphQLString },
    discount       : { type: GraphQLInt },
    monthPostsLimit: { type: GraphQLInt },
  },
});

export const memberTypesQuery = {
  type   : new GraphQLList(memberType),
  resolve: async (_: any, args: Object, fastify: FastifyInstance) => fastify.db.memberTypes.findMany(),
};

export const memberTypeQuery = {
  type   : memberType,
  args   : { id: { type: GraphQLString } },
  resolve: async (_: any, { id }: Record<'id', string>, fastify: FastifyInstance) => fastify.db.memberTypes.findOne({ key: 'id', equals: id }),
};