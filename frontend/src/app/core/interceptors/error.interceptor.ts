import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

interface ApiError {
  code?: string;
  message?: string;
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) return throwError(() => err);
      let message = 'An error occurred';
      if (err.error && typeof err.error === 'object' && 'message' in err.error) {
        message = (err.error as ApiError).message ?? message;
      } else if (err.message) {
        message = err.message;
      }
      toast.error(message);
      return throwError(() => err);
    })
  );
};
