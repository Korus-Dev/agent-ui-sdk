import { describe, expect, it } from 'vitest';
import { parseSampleLaunchArgs, sampleDirectories } from './launch-options';

describe('sample launch options', () => {
  it.each(['codex', 'claude', 'cursor', 'antigravity'])('selects %s from the CLI', backend => {
    expect(parseSampleLaunchArgs(['relay', '--backend', backend])).toEqual({ shape: 'relay', backend });
  });
  it('keeps each sample and backend in a separate home and workspace', () => {
    const profiles = (['spark', 'relay'] as const).flatMap(shape => (['codex', 'claude', 'cursor', 'antigravity'] as const).map(backend => sampleDirectories(shape, backend, '/users/test')));
    expect(new Set(profiles.map(profile => profile.home)).size).toBe(8);
    expect(sampleDirectories('spark', 'claude', '/users/test')).toEqual({ home: '/users/test/.agent-ui-sdk/samples/spark/claude', workspace: '/users/test/.agent-ui-sdk/samples/spark/claude/workspace', desktop: '/users/test/.agent-ui-sdk/samples/spark/claude/desktop', state: '/users/test/.agent-ui-sdk/samples/spark/claude/state' });
  });
  it('defaults Basic to Codex', () => {
    expect(parseSampleLaunchArgs(['basic'])).toEqual({ shape: 'basic', backend: 'codex' });
  });
  it.each([['spark', '--backend', 'unknown'], ['basic', '--backend'], ['basic', 'extra'], ['unknown']])('rejects invalid arguments %j', (...args) => {
    expect(() => parseSampleLaunchArgs(args)).toThrow();
  });
});
