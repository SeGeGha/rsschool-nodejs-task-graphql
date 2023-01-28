import * as lodash from 'lodash';
import {
  GraphQLID, GraphQLList, GraphQLObjectType, GraphQLString, GraphQLNonNull
} from 'graphql';
import { FastifyInstance } from 'fastify';
import { profileType } from './profile';
import { postType } from './post';
import { UserEntity } from '../../../utils/DB/entities/DBUsers';
import { validateId } from '../../../utils/uuidValidator';

// @ts-ignore
export const userType = new GraphQLObjectType({
  name  : 'User',
  fields: () => ({
    id                 : { type: GraphQLID },
    firstName          : { type: GraphQLString },
    lastName           : { type: GraphQLString },
    email              : { type: GraphQLString },
    subscribedToUserIds: { type: new GraphQLList(GraphQLID) },
    posts              : {
      type   : new GraphQLList(postType),
      resolve: async (user: UserEntity, args: Object, fastify: FastifyInstance) => fastify.db.posts.findMany({ key: 'userId', equals: user.id })
    },
    profile            : {
      type   : profileType,
      resolve: async (user: UserEntity, args: Object, fastify: FastifyInstance) => fastify.db.profiles.findOne({ key: 'userId', equals: user.id }),
    },
    subscribedToUser   : {
      type   : new GraphQLList(userType),
      resolve: async (user: UserEntity, args: Object, fastify: FastifyInstance) => fastify.db.users.findMany({ key: 'id', equalsAnyOf: user.subscribedToUserIds }),
    },
    userSubscribedTo   : {
      type   : new GraphQLList(userType),
      resolve: async (user: UserEntity, args: Object, fastify: FastifyInstance) => fastify.db.users.findMany({ key: 'subscribedToUserIds', inArray: user.id }),
    },
  }),
});

export const usersQuery = {
  type   : new GraphQLList(userType),
  resolve: async (_: any, args: Object, fastify: FastifyInstance) => fastify.db.users.findMany(),
};

export const userQuery = {
  type   : userType,
  args   : { id: { type: GraphQLID } },
  resolve: async (_: any, { id }: Record<'id', string>, fastify: FastifyInstance) => {
    const user = await fastify.db.users.findOne({ key: 'id', equals: id })
    if (!user) {
      throw fastify.httpErrors.notFound(`User with id ${id} not found`);
    }

    return user;
  },
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
  },
  subscribeTo: {
    type   : userType,
    args   : {
      id    : { type: new GraphQLNonNull(GraphQLID) },
      userId: { type: new GraphQLNonNull(GraphQLID) },
    },
    resolve: async (_: any, args: Record<'id' | 'userId', string>, fastify: FastifyInstance) => {
      const { id, userId } = args;

      [ id, userId ].forEach(uuid => {
        if (!validateId(uuid)) throw fastify.httpErrors.badRequest(`Invalid user id - ${id}`);
      });

      const users = await fastify.db.users.findMany({ key: 'id', equalsAnyOf: [ id, userId ] });
      const subscriber = users.find(user => user.id === id);
      if (!subscriber) {
        throw fastify.httpErrors.notFound(`User-subscriber with id ${id} not found`);
      }
      const publisher  = users.find(user => user.id === userId);
      if (!publisher) {
        throw fastify.httpErrors.notFound(`User-publisher with id ${userId} not found`);
      }

      if (!publisher.subscribedToUserIds.includes(subscriber.id)) {
        const { id, ...userDTO } = lodash.cloneDeep(publisher);
        userDTO.subscribedToUserIds.push(subscriber.id);

        await fastify.db.users.change(publisher.id, userDTO);
      }

      return subscriber;
    },
  },
  unsubscribeFrom: {
    type: userType,
    args: {
      id    : { type: new GraphQLNonNull(GraphQLID) },
      userId: { type: new GraphQLNonNull(GraphQLID) },
    },
    resolve: async (_: any, args: Record<'id' | 'userId', string>, fastify: FastifyInstance) => {
      const { id, userId } = args;

      [ id, userId ].forEach(uuid => {
        if (!validateId(uuid)) throw fastify.httpErrors.badRequest(`Invalid user id - ${id}`);
      });

      const users      = await fastify.db.users.findMany({key: 'id', equalsAnyOf: [ id, userId ]});
      const subscriber = users.find(user => user.id === id);
      if (!subscriber) {
        throw fastify.httpErrors.notFound(`User-subscriber with id ${id} not found`);
      }
      const publisher  = users.find(user => user.id === userId);
      if (!publisher) {
        throw fastify.httpErrors.notFound(`User-publisher with id ${userId} not found`);
      }

      if (publisher.subscribedToUserIds.includes(subscriber.id)) {
        const { id, ...userDTO } = lodash.cloneDeep(publisher);
        userDTO.subscribedToUserIds = userDTO.subscribedToUserIds.filter(id => id !== subscriber.id);

        await fastify.db.users.change(publisher.id, userDTO);

        return subscriber;
      }

      throw fastify.httpErrors.badRequest(`User ${subscriber.id} is not subscribed to ${publisher.id}`);
    },
  },
};
