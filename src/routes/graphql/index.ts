import { FastifyInstance } from 'fastify';
import { graphql, buildSchema } from 'graphql';
import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { graphqlBodySchema } from './schema';

const schema = buildSchema(`
  type Query {
    users: [User]
    profiles: [Profile]
    posts: [Post]
    memberTypes: [MemberType]
  }
  
  type User {
    id: String
    firstName: String
    lastName: String
    email: String
    subscribedToUserIds: [String]
  }
  
  type Profile {
    id: String
    avatar: String
    sex: String
    birthday: Int
    country: String
    street: String
    city: String
    memberTypeId: String
    userId: String
  }
  
  type Post {
    id: String
    title: String
    content: String
    userId: String
  }
  
  type MemberType {
    id: String
    discount: Int
    monthPostsLimit: Int
  }
`);

const rootValue = {
  async users(args: any, fastify: FastifyInstance) {
    return fastify.db.users.findMany();
  },
  async profiles(args: any, fastify: FastifyInstance) {
    return fastify.db.profiles.findMany();
  },
  async posts(args: any, fastify: FastifyInstance) {
    return fastify.db.posts.findMany();
  },
  async memberTypes(args: any, fastify: FastifyInstance) {
    return fastify.db.memberTypes.findMany();
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
