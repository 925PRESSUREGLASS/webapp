import fastify, { FastifyInstance } from 'fastify';
import { Asset, Feature, Project } from '../../domain/types';

function buildServer(): FastifyInstance {
  var app = fastify();

  app.get('/health', function () {
    return { status: 'ok' };
  });

  app.get('/projects/sample', function () {
    var sampleAsset: Asset = {
      id: 'asset-1',
      name: 'API Gateway',
      type: 'service',
      description: 'Entry point for MetaBuild requests'
    };

    var sampleFeature: Feature = {
      id: 'feature-1',
      name: 'Health Monitoring',
      summary: 'Expose readiness signals for MetaBuild components',
      assets: [sampleAsset]
    };

    var sampleProject: Project = {
      id: 'project-1',
      name: 'MetaBuild Foundation',
      description: 'Initial scaffolding for meta-api and meta-dashboard applications.',
      features: [sampleFeature],
      status: 'in-progress'
    };

    return sampleProject;
  });

  return app;
}

function start() {
  var app = buildServer();
  app.listen({ port: 4000 }, function (err, address) {
    if (err) {
      app.log.error(err);
      process.exit(1);
    }

    app.log.info('meta-api running at ' + address);
  });
}

if (require.main === module) {
  start();
}

export { buildServer, start };
