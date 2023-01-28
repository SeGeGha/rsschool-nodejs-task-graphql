import { GraphQLID, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql';
import { FastifyInstance } from 'fastify';
import { PostEntity } from '../../../utils/DB/entities/DBPosts';

export const postType = new GraphQLObjectType({
  name  : 'Post',
  fields: {
    id     : { type: GraphQLID },
    title  : { type: GraphQLString },
    content: { type: GraphQLString },
    userId : { type: GraphQLID },
  },
});

export const postsQuery = {
  type   : new GraphQLList(postType),
  resolve: async (_: any, args: Object, fastify: FastifyInstance) => fastify.db.posts.findMany(),
};

export const postQuery = {
  type   : postType,
  args   : { id: { type: GraphQLID } },
  resolve: async (_: any, { id }: Record<'id', string>, fastify: FastifyInstance) => fastify.db.posts.findOne({ key: 'id', equals: id }),
};

export const postMutations = {
  createPost: {
    type: postType,
    args: {
      title  : { type: GraphQLString },
      content: { type: GraphQLString },
      userId : { type: GraphQLID },
    },
    resolve: async (_: any, postDTO: Omit<PostEntity, 'id'>, fastify: FastifyInstance) => {
      const { userId } = postDTO;

      const user = await fastify.db.users.findOne({ key: 'id', equals: userId });
      if (!user) {
        throw fastify.httpErrors.badRequest(`Invalid user id - ${userId}`);
      }

      return fastify.db.posts.create(postDTO);
    },
  },
};
