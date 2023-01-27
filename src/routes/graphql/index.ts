import { graphql, GraphQLObjectType, GraphQLSchema } from 'graphql';
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema } from './schema';

const querySchema = new GraphQLObjectType({
  name: 'Query',
  fields: {

  }
});

const mutationSchema = new GraphQLObjectType({
  name: 'Mutation',
  fields: {

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
          query   : querySchema,
          mutation: mutationSchema,
        }),
        source        : String(request.body.query),
        variableValues: request.body.variables,
        contextValue  : fastify,
      });
    }
  );
};

export default plugin;
