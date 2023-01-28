import {
  GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString, GraphQLNonNull
} from 'graphql';
import { FastifyInstance } from 'fastify';
import { profileType } from './profile';
import { postType } from './post';
import { UserEntity } from '../../../utils/DB/entities/DBUsers';
import { validateId } from '../../../utils/uuidValidator';

export const userType = new GraphQLObjectType({
  name  : 'User',
  fields: {
    id                 : { type: GraphQLID },
    firstName          : { type: GraphQLString },
    lastName           : { type: GraphQLString },
    email              : { type: GraphQLString },
    subscribedToUserIds: { type: new GraphQLList(GraphQLInt) },
    posts              : {
      type   : new GraphQLList(postType),
      resolve: async (user: UserEntity, args: Object, fastify: FastifyInstance) => fastify.db.posts.findMany({ key: 'userId', equals: user.id })
    },
    profile            : {
      type   : profileType,
      resolve: async (user: UserEntity, args: Object, fastify: FastifyInstance) => fastify.db.profiles.findOne({ key: 'userId', equals: user.id }),
    },
  },
});

export const usersQuery = {
  type   : new GraphQLList(userType),
  resolve: async (_: any, args: Object, fastify: FastifyInstance) => fastify.db.users.findMany(),
};

export const userQuery = {
  type   : userType,
  args   : { id: { type: GraphQLID } },
  resolve: async (_: any, { id }: Record<'id', string>, fastify: FastifyInstance) => fastify.db.users.findOne({ key: 'id', equals: id }),
};

export const userMutations = {
  createUser: {
    type   : userType,
    args   : {
      firstName: { type: GraphQLString },
      lastName : { type: GraphQLString },
      email    : { type: GraphQLString },
    },
    resolve: async (_: any, userDTO: Omit<UserEntity, 'id' | 'subscribedToUserIds'>, fastify: FastifyInstance) => fastify.db.users.create(userDTO),
  },
  updateUser: {
    type   : userType,
    args   : {
      id       : { type: new GraphQLNonNull(GraphQLID) },
      firstName: { type: GraphQLString },
      lastName : { type: GraphQLString },
      email    : { type: GraphQLString },
    },
    resolve: async (_: any, args: Record<'id', string> & Partial<Omit<UserEntity, 'id'>>, fastify: FastifyInstance) => {
      const { id, ...userDTO } = args;
      if (!validateId(id)) {
        throw fastify.httpErrors.badRequest(`Invalid user id - ${id}`);
      }

      try {
        return await fastify.db.users.change(id, userDTO);
      } catch (error) {
        throw fastify.httpErrors.notFound(`User with id ${id} not found`);
      }
    },
  }
}
