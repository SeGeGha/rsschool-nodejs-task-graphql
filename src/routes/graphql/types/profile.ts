import {
  GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString, GraphQLNonNull
} from 'graphql';
import { FastifyInstance } from 'fastify';
import { memberType } from './memberType';
import { ProfileEntity } from '../../../utils/DB/entities/DBProfiles';
import { validateId } from '../../../utils/uuidValidator';

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
    userId      : { type: GraphQLID },
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
  args   : { id: { type: GraphQLID } },
  resolve: async (_: any, { id }: Record<'id', string>, fastify: FastifyInstance) => fastify.db.profiles.findOne({ key: 'id', equals: id }),
};

export const profileMutations = {
  createProfile: {
    type: profileType,
    args: {
      avatar      : { type: GraphQLString },
      sex         : { type: GraphQLString },
      birthday    : { type: GraphQLInt },
      country     : { type: GraphQLString },
      street      : { type: GraphQLString },
      city        : { type: GraphQLString },
      memberTypeId: { type: GraphQLString },
      userId      : { type: GraphQLID },
    },
    resolve: async (_: any, profileDTO: Omit<ProfileEntity, 'id'>, fastify: FastifyInstance) => {
      const { memberTypeId, userId } = profileDTO;

      const user = await fastify.db.users.findOne({ key: 'id', equals: userId });
      if (!user) {
        throw fastify.httpErrors.badRequest(`Invalid user id - ${userId}`);
      }

      const memberType = await fastify.db.memberTypes.findOne({ key: 'id', equals: memberTypeId });
      if (!memberType) {
        throw fastify.httpErrors.badRequest(`Invalid memberType id - ${memberTypeId}`);
      }

      const userProfile = await fastify.db.profiles.findOne({ key: 'userId', equals: userId });
      if (userProfile) {
        throw fastify.httpErrors.badRequest(`User has profile: profile id - ${userProfile.id}`);
      }

      return fastify.db.profiles.create(profileDTO);
    },
  },
  updateProfile: {
    type: profileType,
    args: {
      id          : { type: new GraphQLNonNull(GraphQLID) },
      avatar      : { type: GraphQLString },
      sex         : { type: GraphQLString },
      birthday    : { type: GraphQLInt },
      country     : { type: GraphQLString },
      street      : { type: GraphQLString },
      city        : { type: GraphQLString },
      memberTypeId: { type: GraphQLString },
    },
    resolve: async (_: any, args: Record<'id', string> & Partial<Omit<ProfileEntity, 'id' | 'userId'>>, fastify: FastifyInstance) => {
      const { id, ...profileDTO } = args;
      if (!validateId(id)) {
        throw fastify.httpErrors.badRequest(`Invalid profile id - ${id}`);
      }

      try {
        return await fastify.db.profiles.change(id, profileDTO);
      } catch (error) {
        throw fastify.httpErrors.notFound(`Profile with id ${id} not found`);
      }
    },
  }
};
