import {
  GraphQLID, GraphQLInt, GraphQLList, GraphQLObjectType, GraphQLString, GraphQLNonNull, GraphQLInputObjectType
} from 'graphql';
import { FastifyInstance } from 'fastify';
import { MemberType } from './memberType';
import { ProfileEntity } from '../../../utils/DB/entities/DBProfiles';
import { validateId } from '../../../utils/uuidValidator';

export const ProfileType = new GraphQLObjectType({
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
      type: MemberType,
      resolve: async (profile: ProfileEntity, args: Object, fastify: FastifyInstance) => fastify.db.memberTypes.findOne({ key: 'id', equals: profile.memberTypeId }),
    }
  },
});

const CreateProfileInputType = new GraphQLInputObjectType({
  name  : 'CreateProfileInput',
  fields: {
    avatar      : { type: new GraphQLNonNull(GraphQLString) },
    sex         : { type: new GraphQLNonNull(GraphQLString) },
    birthday    : { type: new GraphQLNonNull(GraphQLInt) },
    country     : { type: new GraphQLNonNull(GraphQLString) },
    street      : { type: new GraphQLNonNull(GraphQLString) },
    city        : { type: new GraphQLNonNull(GraphQLString) },
    memberTypeId: { type: new GraphQLNonNull(GraphQLString) },
    userId      : { type: new GraphQLNonNull(GraphQLID) },
  },
});

const ChangeProfileInputType = new GraphQLInputObjectType({
  name  : 'ChangeProfileInput',
  fields: {
    id          : { type: new GraphQLNonNull(GraphQLID) },
    avatar      : { type: GraphQLString },
    sex         : { type: GraphQLString },
    birthday    : { type: GraphQLInt },
    country     : { type: GraphQLString },
    street      : { type: GraphQLString },
    city        : { type: GraphQLString },
    memberTypeId: { type: GraphQLString },
  },
});

export const profilesQuery = {
  type   : new GraphQLList(ProfileType),
  resolve: async (_: any, args: Object, fastify: FastifyInstance) => fastify.db.profiles.findMany(),
};

export const profileQuery = {
  type   : ProfileType,
  args   : { id: { type: GraphQLID } },
  resolve: async (_: any, { id }: Record<'id', string>, fastify: FastifyInstance) => {
    const profile = await fastify.db.profiles.findOne({ key: 'id', equals: id });
    if (!profile) {
      throw fastify.httpErrors.notFound(`Profile with id ${id} not found`);
    }

    return profile;
  },
};

type CreateProfileArgs = Record<'data', Omit<ProfileEntity, 'id'>>
type ChangeProfileArgs = Record<'data', Record<'id', string> & Partial<Omit<ProfileEntity, 'id' | 'userId'>>>

export const profileMutations = {
  createProfile: {
    type: ProfileType,
    args: {
      data: {
        name: 'data',
        type: new GraphQLNonNull(CreateProfileInputType),
      },
    },
    resolve: async (_: any, { data: profileDTO }: CreateProfileArgs, fastify: FastifyInstance) => {
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
    type: ProfileType,
    args: {
      data: {
        name: 'data',
        type: new GraphQLNonNull(ChangeProfileInputType),
      }
    },
    resolve: async (_: any, args: ChangeProfileArgs, fastify: FastifyInstance) => {
      const { id, ...profileDTO } = args.data;
      if (!validateId(id)) {
        throw fastify.httpErrors.badRequest(`Invalid profile id - ${id}`);
      }

      const { memberTypeId } = profileDTO;
      if (memberTypeId) {
        const memberType = await fastify.db.memberTypes.findOne({ key: 'id', equals: memberTypeId });
        if (!memberType) {
          throw fastify.httpErrors.badRequest(`Invalid memberType id - ${memberTypeId}`);
        }
      }

      try {
        return await fastify.db.profiles.change(id, profileDTO);
      } catch (error) {
        throw fastify.httpErrors.notFound(`Profile with id ${id} not found`);
      }
    },
  }
};
