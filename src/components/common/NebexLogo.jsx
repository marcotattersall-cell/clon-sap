import React from 'react';
import { AxomiraLogo } from './AxomiraLogo';

/**
 * NebexLogo (Legacy compatibility wrapper -> AxomiraLogo)
 */
export default function NebexLogo(props) {
  return <AxomiraLogo {...props} />;
}
export { AxomiraLogo as NebexLogo };
