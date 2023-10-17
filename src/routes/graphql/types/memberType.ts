import {
  GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLInputObjectType, GraphQLString,
} from 'graphql';
import { FastifyInstance } from 'fastify';
import { MemberTypeEntity } from '../../../utils/DB/entities/DBMemberTypes';

export const MemberType = new GraphQLObjectType({
  name  : 'Member',
  fields: {
    id             : { type: GraphQLString },
    discount       : { type: GraphQLInt },
    monthPostsLimit: { type: GraphQLInt },
  },
});

export const ChangeMemberTypeInput = new GraphQLInputObjectType({
  name: 'ChangeMemberTypeInput',
  fields: {
    id             : { type: new GraphQLNonNull(GraphQLString) },
    discount       : { type: GraphQLInt },
    monthPostsLimit: { type: GraphQLInt },
  },
})

export const memberTypesQuery = {
  type   : new GraphQLList(MemberType),
  resolve: async (_: any, args: Object, fastify: FastifyInstance) => fastify.db.memberTypes.findMany(),
};

export const memberTypeQuery = {
  type   : MemberType,
  args   : { id: { type: GraphQLString } },
  resolve: async (_: any, { id }: Record<'id', string>, fastify: FastifyInstance) => {
    const memberType = await fastify.db.memberTypes.findOne({ key: 'id', equals: id })
    if (!memberType) {
      throw fastify.httpErrors.notFound(`Member type with id ${id} not found`);
    }

    return memberType;
  },
};

type ChangeMemberTypeArgs = Record<'data', Record<'id', string> & Partial<Omit<MemberTypeEntity, 'id'>>>

export const memberTypeMutations = {
  updateMemberType: {
    type: MemberType,
    args: {
      data: {
        name: 'data',
        type: new GraphQLNonNull(ChangeMemberTypeInput),
      }
    },
    resolve: async (_: any, args: ChangeMemberTypeArgs, fastify: FastifyInstance) => {
      const { id, ...memberTypeDTO } = args.data;

      try {
        return await fastify.db.memberTypes.change(id, memberTypeDTO);
      } catch (error) {
        throw fastify.httpErrors.badRequest(`Invalid member type id - ${id}`);
      }
    },
  }
}