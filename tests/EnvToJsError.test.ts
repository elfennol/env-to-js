import { EnvToJsError } from '../src';

describe('EnvToJsError', () => {
  it('is an instance of Error', () => {
    expect(new EnvToJsError('test')).toBeInstanceOf(Error);
  });

  it('is an instance of EnvToJsError', () => {
    expect(new EnvToJsError('test')).toBeInstanceOf(EnvToJsError);
  });

  it('has name EnvToJsError', () => {
    expect(new EnvToJsError('test').name).toBe('EnvToJsError');
  });

  it('preserves the message', () => {
    expect(new EnvToJsError('my message').message).toBe('my message');
  });

});
