import { GraphQLNonNull, GraphQLID, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql';
import { FastifyInstance } from 'fastify';
import { PostEntity } from '../../../utils/DB/entities/DBPosts';
import { validateId } from '../../../utils/uuidValidator';

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
  resolve: async (_: any, { id }: Record<'id', string>, fastify: FastifyInstance) => {
    const post = await fastify.db.posts.findOne({ key: 'id', equals: id });
    if (!post) {
      throw fastify.httpErrors.notFound(`Post with id ${id} not found`);
    }

    return post;
  },
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
  updatePost: {
    type: postType,
    args: {
      id     : { type: new GraphQLNonNull(GraphQLID) },
      title  : { type: GraphQLString },
      content: { type: GraphQLString },
    },
    resolve: async (_: any, args: Record<'id', string> & Partial<Omit<PostEntity, 'id' | 'userId'>>, fastify: FastifyInstance) => {
      const { id, ...postDTO } = args;
      if (!validateId(id)) {
        throw fastify.httpErrors.badRequest(`Invalid post id - ${id}`);
      }

      try {
        return await fastify.db.posts.change(id, postDTO);
      } catch (error) {
        throw fastify.httpErrors.notFound(`Post with id ${id} not found`);
      }
    },
  },
};
