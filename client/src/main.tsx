import '@/assets/styles/common.scss';
import { registerToast, registerUserInfo } from '@/plugins';
import App from './App';

function bootstrap() {
  const container = document.getElementById('app');
  container.innerHTML = '';

  // 挂载插件
  registerToast();
  registerUserInfo();

  return render(() => <App />, container);
}

bootstrap();
