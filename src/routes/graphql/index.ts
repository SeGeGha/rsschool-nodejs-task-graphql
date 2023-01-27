import { FastifyInstance } from 'fastify';
import { graphql, buildSchema } from 'graphql';
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema } from './schema';

const schema = buildSchema(`
  type Query {
    users: [User]
  }
  
  type User {
    id: String
    firstName: String
    lastName: String
    email: String
    subscribedToUserIds: [String]
  }
`);

const rootValue = {
  async users(args: any, fastify: FastifyInstance) {
    return fastify.db.users.findMany();
  },
}

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
        schema,
        rootValue,
        source        : String(request.body.query),
        variableValues: request.body.variables,
        contextValue  : fastify,
      });
    }
  );
};

export default plugin;
