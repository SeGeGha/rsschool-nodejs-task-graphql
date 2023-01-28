import { GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';
import { FastifyInstance } from 'fastify';
import { MemberTypeEntity } from '../../../utils/DB/entities/DBMemberTypes';

export const memberType = new GraphQLObjectType({
  name  : 'MemberType',
  fields: {
    id             : { type: GraphQLString },
    discount       : { type: GraphQLInt },
    monthPostsLimit: { type: GraphQLInt },
  },
});

export const memberTypesQuery = {
  type   : new GraphQLList(memberType),
  resolve: async (_: any, args: Object, fastify: FastifyInstance) => fastify.db.memberTypes.findMany(),
};

export const memberTypeQuery = {
  type   : memberType,
  args   : { id: { type: GraphQLString } },
  resolve: async (_: any, { id }: Record<'id', string>, fastify: FastifyInstance) => {
    const memberType = await fastify.db.memberTypes.findOne({ key: 'id', equals: id })
    if (!memberType) {
      throw fastify.httpErrors.notFound(`Member type with id ${id} not found`);
    }

    return memberType;
  },
};

export const memberTypeMutations = {
  updateMemberType: {
    type: memberType,
    args: {
      id             : { type: new GraphQLNonNull(GraphQLString) },
      discount       : { type: GraphQLInt },
      monthPostsLimit: { type: GraphQLInt },
    },
    resolve: async (_: any, args: Record<'id', string> & Partial<Omit<MemberTypeEntity, 'id'>>, fastify: FastifyInstance) => {
      const { id, ...memberTypeDTO } = args;

      try {
        return await fastify.db.memberTypes.change(id, memberTypeDTO);
      } catch (error) {
        throw fastify.httpErrors.badRequest(`Invalid member type id - ${id}`);
      }
    },
  }
}