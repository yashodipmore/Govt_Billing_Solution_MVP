import React, { useState } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonContent,
  IonGrid,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonRow,
  IonToast,
  IonText,
  IonIcon,
  IonCheckbox
} from '@ionic/react';
import { logoGoogle, mailOutline, lockClosedOutline, personOutline } from 'ionicons/icons';
import { authService } from '../services/authService';
import { useHistory } from 'react-router-dom';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastColor, setToastColor] = useState<'success' | 'danger'>('success');
  const history = useHistory();

  const showToastMessage = (message: string, color: 'success' | 'danger' = 'success') => {
    setToastMessage(message);
    setToastColor(color);
    setShowToast(true);
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      showToastMessage('Please fill in all required fields', 'danger');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      showToastMessage('Passwords do not match', 'danger');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await authService.login(email, password);
        showToastMessage('Login successful!');
        history.push('/home');
      } else {
        await authService.signup(email, password, displayName);
        showToastMessage('Account created successfully!');
        history.push('/home');
      }
    } catch (error: any) {
      showToastMessage(error.message || 'Authentication failed', 'danger');
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
      showToastMessage('Google sign in successful!');
      history.push('/home');
    } catch (error: any) {
      showToastMessage(error.message || 'Google sign in failed', 'danger');
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showToastMessage('Please enter your email address', 'danger');
      return;
    }

    try {
      await authService.resetPassword(email);
      showToastMessage('Password reset email sent!');
    } catch (error: any) {
      showToastMessage(error.message || 'Failed to send reset email', 'danger');
    }
  };

  return (
    <IonPage>
      <IonContent fullscreen>
        <IonGrid>
          <IonRow className="ion-justify-content-center">
            <IonCol size="12" sizeMd="6" sizeLg="4">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle className="ion-text-center">
                    {isLogin ? 'Sign In' : 'Create Account'}
                  </IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {!isLogin && (
                    <IonItem>
                      <IonIcon icon={personOutline} slot="start" />
                      <IonLabel position="stacked">Display Name</IonLabel>
                      <IonInput
                        type="text"
                        value={displayName}
                        onIonInput={(e) => setDisplayName(e.detail.value!)}
                        placeholder="Enter your name"
                      />
                    </IonItem>
                  )}

                  <IonItem>
                    <IonIcon icon={mailOutline} slot="start" />
                    <IonLabel position="stacked">Email</IonLabel>
                    <IonInput
                      type="email"
                      value={email}
                      onIonInput={(e) => setEmail(e.detail.value!)}
                      placeholder="Enter your email"
                    />
                  </IonItem>

                  <IonItem>
                    <IonIcon icon={lockClosedOutline} slot="start" />
                    <IonLabel position="stacked">Password</IonLabel>
                    <IonInput
                      type="password"
                      value={password}
                      onIonInput={(e) => setPassword(e.detail.value!)}
                      placeholder="Enter your password"
                    />
                  </IonItem>

                  {!isLogin && (
                    <IonItem>
                      <IonIcon icon={lockClosedOutline} slot="start" />
                      <IonLabel position="stacked">Confirm Password</IonLabel>
                      <IonInput
                        type="password"
                        value={confirmPassword}
                        onIonInput={(e) => setConfirmPassword(e.detail.value!)}
                        placeholder="Confirm your password"
                      />
                    </IonItem>
                  )}

                  <div className="ion-padding-top">
                    <IonButton
                      expand="block"
                      onClick={handleEmailAuth}
                      disabled={loading}
                    >
                      {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </IonButton>

                    <IonButton
                      expand="block"
                      fill="outline"
                      onClick={handleGoogleAuth}
                      disabled={loading}
                      className="ion-margin-top"
                    >
                      <IonIcon icon={logoGoogle} slot="start" />
                      Continue with Google
                    </IonButton>

                    {isLogin && (
                      <IonButton
                        fill="clear"
                        size="small"
                        onClick={handleForgotPassword}
                        className="ion-margin-top"
                      >
                        Forgot Password?
                      </IonButton>
                    )}

                    <div className="ion-text-center ion-margin-top">
                      <IonText>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <IonButton
                          fill="clear"
                          size="small"
                          onClick={() => setIsLogin(!isLogin)}
                        >
                          {isLogin ? 'Sign Up' : 'Sign In'}
                        </IonButton>
                      </IonText>
                    </div>
                  </div>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color={toastColor}
        />
      </IonContent>
    </IonPage>
  );
};

export default AuthPage;
