import { GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql';
import { FastifyInstance } from 'fastify';
import { profileType } from './profile';
import { postType } from './post';
import { memberType } from './memberType';
import { UserEntity } from '../../../utils/DB/entities/DBUsers';

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
    memberType         : {
      type   : memberType,
      resolve: async (user: UserEntity, args: Object, fastify: FastifyInstance) => {
        const profile = await fastify.db.profiles.findOne({ key: 'userId', equals: user.id });

        return (
          profile
            ? await fastify.db.memberTypes.findOne({ key: 'id', equals: profile.memberTypeId })
            : null
        );
      },
    }
  },
});

export const usersQuery = {
  type   : new GraphQLList(userType),
  resolve: async (_: any, args: Object, fastify: FastifyInstance) => fastify.db.users.findMany(),
};

export const userQuery = {
  type   : userType,
  args   : { id: { type: GraphQLString } },
  resolve: async (_: any, { id }: Record<'id', string>, fastify: FastifyInstance) => fastify.db.users.findOne({ key: 'id', equals: id }),
};
