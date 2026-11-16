import { NoiBai } from './NoiBai';

export function TongHop({ pushToast }) {
  return <NoiBai route={{ kind: 'tonghop' }} pushToast={pushToast} initialTab="tonghop" />;
}
