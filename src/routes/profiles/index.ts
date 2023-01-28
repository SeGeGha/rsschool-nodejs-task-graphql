import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { validateId } from '../../utils/uuidValidator';
import { createProfileBodySchema, changeProfileBodySchema } from './schema';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (
  fastify
): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<
    ProfileEntity[]
  > {
    return this.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { id } = request.params as Record<'id', string>;

      const profile = await this.db.profiles.findOne({ key: 'id', equals: id });
      if (!profile) {
        throw reply.notFound(`Profile with id ${id} not found`);
      }

      return profile;
    }
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { memberTypeId, userId } = request.body as ProfileEntity;

      const memberType = await this.db.memberTypes.findOne({ key: 'id', equals: memberTypeId });
      if (!memberType) {
        throw reply.badRequest(`Invalid member type id ${memberTypeId}`);
      }

      const user = await this.db.users.findOne({ key: 'id', equals: userId });
      if (!user) {
        throw reply.badRequest(`Invalid user id - ${userId}`);
      }

      const userProfile = await this.db.profiles.findOne({ key: 'userId', equals: userId });
      if (userProfile) {
        throw reply.badRequest(`User has profile: profile id - ${userProfile.id}`);
      }

      return this.db.profiles.create(request.body as Omit<ProfileEntity, 'id' | 'subscribedToUserIds'>);
    }
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { id } = request.params as Record<'id', string>;
      if (!validateId(id)) {
        throw reply.badRequest(`Invalid profile id ${id}`);
      }

      try {
        return await this.db.profiles.delete(id);
      } catch (error) {
        throw reply.notFound(`Profile with id ${id} not found`);
      }
    }
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { id } = request.params as Record<'id', string>;
      if (!validateId(id)) {
        throw reply.badRequest(`Invalid profile id ${id}`);
      }

      const { memberTypeId } = request.body as Partial<Omit<ProfileEntity, 'id' | 'userId'>>;
      if (memberTypeId) {
        const memberType = await fastify.db.memberTypes.findOne({ key: 'id', equals: memberTypeId });
        if (!memberType) {
          throw fastify.httpErrors.badRequest(`Invalid memberType id - ${memberTypeId}`);
        }
      }

      try {
        return await this.db.profiles.change(id, request.body as Partial<Omit<ProfileEntity, 'id' | 'userId'>>);
      } catch (error) {
        throw reply.notFound(`Profile with id ${id} not found`);
      }
    }
  );
};

export default plugin;
