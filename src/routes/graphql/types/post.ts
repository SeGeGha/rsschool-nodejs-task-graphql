import { GraphQLID, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql';
import { FastifyInstance } from 'fastify';

export const postType = new GraphQLObjectType({
  name  : 'Post',
  fields: {
    id     : { type: GraphQLID },
    title  : { type: GraphQLString },
    content: { type: GraphQLString },
    userId : { type: GraphQLString },
  },
});

export const postsQuery = {
  type   : new GraphQLList(postType),
  resolve: async (_: any, args: Object, fastify: FastifyInstance) => fastify.db.posts.findMany(),
};

export const postQuery = {
  type   : postType,
  args   : { id: { type: GraphQLString } },
  resolve: async (_: any, { id }: Record<'id', string>, fastify: FastifyInstance) => fastify.db.posts.findOne({ key: 'id', equals: id }),
};
