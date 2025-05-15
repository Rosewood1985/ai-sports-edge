# AI Sports Edge Makefile
# Provides shortcuts for common operations

.PHONY: help ops firebase-migrate firebase-status firebase-tag firebase-accelerate memory-update memory-checkpoint scripts-consolidate scripts-consolidate-comprehensive \
	test-unit test-integration test-e2e test-coverage \
	lint-js lint-css lint-fix lint-staged \
	build-dev build-prod build-analyze build-watch \
	clean-orphans deduplicate-files migrate-firebase \
	context-status context-clear \
	build-cli publish-cli setup-cli \
	deploy

# Default target
help:
	@echo "AI Sports Edge Makefile"
	@echo ""
	@echo "Usage:"
	@echo "  make help                 Show this help message"
	@echo "  make ops                  Run the ops CLI tool"
	@echo ""
	@echo "Firebase Migration Commands:"
	@echo "  make firebase-migrate     Run the complete migration process"
	@echo "  make firebase-status      Check migration status"
	@echo "  make firebase-tag         Retroactively tag migrated files"
	@echo "  make firebase-accelerate  Accelerate migration process"
	@echo ""
	@echo "Memory Bank Commands:"
	@echo "  make memory-update        Update memory bank"
	@echo "  make memory-checkpoint    Create memory bank checkpoint"
	@echo ""
	@echo "Script Management Commands:"
	@echo "  make scripts-consolidate             Consolidate scattered scripts into the scripts directory"
	@echo "  make scripts-consolidate-comprehensive  Comprehensive consolidation with reference updates"
	@echo ""
	@echo "Testing Commands:"
	@echo "  make test-unit                       Run unit tests"
	@echo "  make test-integration                Run integration tests"
	@echo "  make test-e2e                        Run end-to-end tests"
	@echo "  make test-coverage                   Generate test coverage report"
	@echo ""
	@echo "Linting Commands:"
	@echo "  make lint-js                         Lint JavaScript and TypeScript files"
	@echo "  make lint-css                        Lint CSS and style files"
	@echo "  make lint-fix                        Fix all auto-fixable lint issues"
	@echo "  make lint-staged                     Lint staged files"
	@echo ""
	@echo "Building Commands:"
	@echo "  make build-dev                       Build the application for development"
	@echo "  make build-prod                      Build the application for production"
	@echo "  make build-analyze                   Build and analyze bundle size"
	@echo "  make build-watch                     Build and watch for changes"
	@echo ""
	@echo "Maintenance Commands:"
	@echo "  make clean-orphans                   Clean orphaned files and dependencies"
	@echo "  make deduplicate-files               Find and deduplicate files"
	@echo "  make migrate-firebase                Migrate Firebase services to atomic architecture"
	@echo ""
	@echo "Context Commands:"
	@echo "  make context-status                  Show the current context status"
	@echo "  make context-clear                   Clear the current context"
	@echo ""
	@echo "CLI Package Commands:"
	@echo "  make build-cli                       Build the CLI package (dry run)"
	@echo "  make publish-cli                     Build and publish the CLI package"
	@echo "  make setup-cli                       Run script consolidation and publish CLI"
	@echo ""
	@echo "Deployment Commands:"
	@echo "  make deploy               Deploy to all targets"
	@echo "  make deploy-firebase      Deploy to Firebase only"
	@echo "  make deploy-godaddy       Deploy to GoDaddy only"

# Ops CLI
ops:
	npm run ops

# Firebase Migration Commands
firebase-migrate:
	npm run firebase:migrate

firebase-status:
	npm run firebase:status

firebase-tag:
	npm run firebase:tag

firebase-accelerate:
	npm run firebase:accelerate

# Memory Bank Commands
memory-update:
	npm run memory:update

memory-checkpoint:
	npm run memory:checkpoint

# Script Management Commands
scripts-consolidate:
	npm run scripts:consolidate

scripts-consolidate-comprehensive:
	npm run scripts:consolidate:comprehensive

# Testing Commands
test-unit:
	npm run test:unit

test-integration:
	npm run test:integration

test-e2e:
	npm run test:e2e

test-coverage:
	npm run test:coverage

# Linting Commands
lint-js:
	npm run lint:js

lint-css:
	npm run lint:css

lint-fix:
	npm run lint:fix

lint-staged:
	npm run lint:staged

# Building Commands
build-dev:
	npm run build:dev

build-prod:
	npm run build:prod

build-analyze:
	npm run build:analyze

build-watch:
	npm run build:watch

# Maintenance Commands
clean-orphans:
	npm run clean:orphans

deduplicate-files:
	npm run deduplicate:files

migrate-firebase:
	npm run migrate:firebase

# Context Commands
context-status:
	npm run context:status

context-clear:
	npm run context:clear

# CLI Package Commands
build-cli:
	npm run build:cli

publish-cli:
	npm run publish:cli

setup-cli:
	npm run setup:cli

# Deployment Commands
deploy:
	npm run ops deploy

deploy-firebase:
	npm run ops deploy -- --target=firebase

deploy-godaddy:
	npm run ops deploy -- --target=godaddy