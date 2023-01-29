import * as depthLimit from 'graphql-depth-limit';
import { graphql, GraphQLSchema, GraphQLObjectType, validate, parse } from 'graphql';
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema } from './schema';
import {
  usersQuery, userQuery, userMutations,
  profilesQuery, profileQuery, profileMutations,
  postsQuery, postQuery, postMutations,
  memberTypesQuery, memberTypeQuery,memberTypeMutations
} from './types';
import { MAX_DEPTH_LIMIT } from '../../constants';

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
    createUser : userMutations.createUser,
    updateUser : userMutations.updateUser,

    subscribeTo    : userMutations.subscribeTo,
    unsubscribeFrom: userMutations.unsubscribeFrom,

    createProfile: profileMutations.createProfile,
    updateProfile: profileMutations.updateProfile,

    createPost: postMutations.createPost,
    updatePost: postMutations.updatePost,

    updateMemberType: memberTypeMutations.updateMemberType,
  },
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
      let { query, variables } = request.body;
      query = String(query);

      const schema = new GraphQLSchema({
        query   : queryRootType,
        mutation: mutationRootType,
      });

      const errors = validate(schema, parse(query), [ depthLimit(MAX_DEPTH_LIMIT) ]);
      if (errors.length) {
        return {
          errors,
          data: null,
        };
      }

      return await graphql({
        schema,
        source        : query,
        variableValues: variables,
        contextValue  : fastify,
      });
    }
  );
};

export default plugin;
