import Application from '@/views/application'
import { OToast } from '@/components/toast';

export default function App() {
  return (
    <>
      <Application />

      {/* 全局组件 */}
      <OToast />
    </>
  );
}
