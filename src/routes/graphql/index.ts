import { graphql, GraphQLSchema, GraphQLObjectType } from 'graphql';
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema } from './schema';
import {
  usersQuery, userQuery, userMutations,
  profilesQuery, profileQuery,
  postsQuery, postQuery,
  memberTypesQuery, memberTypeQuery,
} from './types';

const queryRootType = new GraphQLObjectType({
  name  : 'Query',
  fields: {
    users: usersQuery,
    user : userQuery,

    profiles: profilesQuery,
    profile : profileQuery,

    posts: postsQuery,
    post : postQuery,

    memberTypes: memberTypesQuery,
    memberType : memberTypeQuery,
  },
});

const mutationRootType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    createUser: userMutations.createUser,
  }
});

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.post(
    '/',
    {
      schema: {
        body: graphqlBodySchema,
      },
    },
    async function (request, reply) {
      return await graphql({
        schema        : new GraphQLSchema({
          query   : queryRootType,
          mutation: mutationRootType,
        }),
        source        : String(request.body.query),
        variableValues: request.body.variables,
        contextValue  : fastify,
      });
    }
  );
};

export default plugin;
