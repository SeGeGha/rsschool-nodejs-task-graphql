import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { validateId } from '../../utils/uuidValidator';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return this.db.posts.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id } = request.params as Record<'id', string>;

      const post = await this.db.posts.findOne({ key: 'id', equals: id });
      if (!post) {
        throw reply.notFound(`Post with id ${id} not found`);
      }

      return post;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { userId } = request.body as Omit<PostEntity, 'id'>;

      const user = await this.db.users.findOne({ key: 'id', equals: userId });
      if (!user) {
        throw reply.badRequest(`Invalid user id - ${userId}`);
      }

      return this.db.posts.create(request.body as Omit<PostEntity, 'id'>);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id } = request.params as Record<'id', string>;
      if (!validateId(id)) {
        throw reply.badRequest(`Invalid post id ${id}`);
      }

      try {
        return await this.db.posts.delete(id);
      } catch (error) {
        throw reply.notFound(`Post with id ${id} not found`);
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id } = request.params as Record<'id', string>;
      if (!validateId(id)) {
        throw reply.badRequest(`Invalid post id ${id}`);
      }

      try {
        return await this.db.posts.change(id, request.body as Partial<Omit<PostEntity, 'id' | 'userId'>>);
      } catch (error) {
        throw reply.notFound(`Post with id ${id} not found`);
      }
    }
  );
};

export default plugin;
