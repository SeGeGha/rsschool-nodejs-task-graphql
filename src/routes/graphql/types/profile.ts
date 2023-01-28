import { GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString } from 'graphql';
import { FastifyInstance } from 'fastify';
import { memberType } from './memberType';
import { ProfileEntity } from '../../../utils/DB/entities/DBProfiles';

export const profileType = new GraphQLObjectType({
  name  : 'Profile',
  fields: {
    id          : { type: GraphQLID },
    avatar      : { type: GraphQLString },
    sex         : { type: GraphQLString },
    birthday    : { type: GraphQLInt },
    country     : { type: GraphQLString },
    street      : { type: GraphQLString },
    city        : { type: GraphQLString },
    memberTypeId: { type: GraphQLString },
    userId      : { type: GraphQLString },
    memberType  : {
      type: memberType,
      resolve: async (profile: ProfileEntity, args: Object, fastify: FastifyInstance) => fastify.db.memberTypes.findOne({ key: 'id', equals: profile.memberTypeId }),
    }
  },
});

export const profilesQuery = {
  type   : new GraphQLList(profileType),
  resolve: async (_: any, args: Object, fastify: FastifyInstance) => fastify.db.profiles.findMany(),
};

export const profileQuery = {
  type   : profileType,
  args   : { id: { type: GraphQLString } },
  resolve: async (_: any, { id }: Record<'id', string>, fastify: FastifyInstance) => fastify.db.profiles.findOne({ key: 'id', equals: id }),
};
