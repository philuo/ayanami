import { toast } from '@/components/toast/hooks';

export function registerToast() {
  window.$toast = toast;
}

export function registerUserInfo() {
  // const urlParams = new URLSearchParams(location.search);

}
