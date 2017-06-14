import React, { Component } from 'react'
import{
    AppRegistry,
    StyleSheet,
    Text,
    View,
    Image,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Navigator,
    AsyncStorage,
    ActivityIndicator,
    Alert
} from 'react-native'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { ActionCreators } from './Actions'
import Registration from './registration'
import FBSDK  from 'react-native-fbsdk'
import { GoogleSignin, GoogleSigninButton } from 'react-native-google-signin'

const{
    LoginButton,
    AccessToken
} = FBSDK
const dismissKeyboard = require('dismissKeyboard');
const background = require("../images/background.jpg");
const lockIcon = require("../images/lock.png");
const personIcon = require("../images/person.png");
const mailIcon = require("../images/mail.png");
const Reachability = require("./Util/Reachability");
const LoginService = require('./Api/LoginService');
const Rx = require('rx');
const ErrorMessages = require("./Util/ErrorMessages");
const ErrorAlert = require("./Util/ErrorAlert");
const Config = require('./config');
const AccountAction = require('./Actions/account');
const AccountReducer = require('./Reducers/account');
const UserStore = require('./Store/UserStore');

class Login extends Component{
    constructor(props){
        super(props)
        this.state ={
            loading: false,
            email: '',
            password: '',
            userId: '',
            accessToken: '',
            user: ''
        }
    }

    componentDidMount(){
        this._setupGoogleSignin()
    }

    goToSignUp(){
        this.props.navigator.replace({
            title: 'Registration',
            id: 'Registration'
        })
    }

    gotToForgotPassword(){
        this.props.navigator.replace({
            title: 'Forgot Password',
            id: 'ForgotPassword'
        })
    }

    signIn(){
        Reachability.isNetReachable()
            .map((isReachable) => {
                return {
                    'username': this.state.email,
                    'password': this.state.password
                }
            }, this)
            .flatMap((userCredentials) => {
                return Rx.Observable.fromPromise(LoginService.login({
                    username: userCredentials.username,
                    password: userCredentials.password
                }))
                .timeout(Config.timeoutThreshold, new Error(ErrorMessages.serverError));
            })
            .map((response) => {
                return {
                    tokenType: response.token_type,
                    expiresIn: response.expires_in,
                    accessToken: response.access_token,
                    refreshToken: response.refreshToken
                }
            })
            .subscribe(
            function (response) {
                UserStore.dispatch({
                    accessToken: response.accessToken,
                    type: 'UPDATE_ACCESS_TOKEN'
                });

                UserStore.dispatch({
                    username: this.state.email,
                    type: 'LOGIN'
                });

                this.props.navigator.replace({
                    title: 'Home',
                    id: 'Home'
                })
            }.bind(this),
            function (error) {
                ErrorAlert.show(error);
            }.bind(this)
            );
    }

    async _setupGoogleSignin(){
        try {
            await GoogleSignin.hasPlayServices({autoResolve: true})
            await GoogleSignin.configure({
                iosClientId:'com.googleusercontent.apps.64926634916-vst43n1gvuulj73nld1ggfqi7f5al49s',
                offlineAccess: false
            })

            const user = await GoogleSignin.currentUserAsync()
            this.setState({user})
        } catch (error) {
            console.log('Google signIn error', err.code, err.message)
        }
    }

    signInGoogle(){
        GoogleSignin.hasPlayServices({ autoResolve: true}).then(() => {
            this.setState({user})
        })
        .catch((err) => {
            console.log("Play services error", err.code, err.message)
        })
    }

    render(){
        return(
            <TouchableWithoutFeedback
                onPress={() => dismissKeyboard()}
                style={{flex: 1}}>
                <View style={[styles.background,styles.container]} >
                        <View style={styles.container} />
                            <View style={styles.wrapper}>
                                <View style={styles.inputWrap}>
                                    <View style={styles.iconWrap}>
                                        <Image
                                            source={personIcon}
                                            style = {styles.icon}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <TextInput
                                        testID="test-id-textfield-email"
                                        placeholder="Email"
                                        style={styles.input}
                                        underlineColorAndroid="transparent"
                                        onChangeText={(email) => this.setState({email})}
                                        value={this.state.email}
                                    />
                                </View>
                                <View style={styles.inputWrap}>
                                    <View style={styles.iconWrap}>
                                        <Image
                                            source={lockIcon}
                                            style = {styles.icon}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <TextInput
                                        testID="test-id-textfield-password"
                                        placeholder="Password"
                                        secureTextEntry
                                        style={styles.input}
                                        underlineColorAndroid="transparent"
                                        onChangeText={(password) => this.setState({password})}
                                        value={this.state.password}
                                    />
                                </View>
                                <TouchableOpacity activeOpacity={.5}
                                    testID="test-id-buttonSignIn"
                                    onPress= {this.signIn.bind(this)}>
                                    <View style={styles.button}>
                                        <Text style={styles.buttonText}>Login</Text>
                                    </View>
                                </TouchableOpacity>
                                <LoginButton
                                    publishPermissions={["publish_actions"]}
                                    onLoginFinished={
                                        (error, result) => {
                                            if (error){
                                                alert("login has error : " + result.error)
                                            }else if (result.isCancelled){
                                                alert("login is cancelled")
                                            }else{
                                                AccessToken.getCurrentAccessToken().then(
                                                    (data) => {
                                                        alert(data.accessToken.toString())
                                                    }
                                                )
                                            }
                                        }
                                    }
                                    onLogoutFinished={() => alert('logout')}
                                />
                                <GoogleSigninButton 
                                    style={{width: 212, height: 48}}
                                    size={GoogleSigninButton.Size.Standard}
                                    color={GoogleSigninButton.Color.Auto}
                                    onPress={this.signInGoogle.bind(this)}
                                />
                                <TouchableOpacity testID="test-id-buttonSignUp" activeOpacity={.5}
                                    onPress={ this.goToSignUp.bind(this) }>
                                    <View>
                                        <Text style={styles.signUp}>Do not have an account, Create One!</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity testID="test-id-buttonForgot" activeOpacity={.5}
                                    onPress={ this.gotToForgotPassword.bind(this) }>
                                    <View>
                                        <Text style={styles.signUp}>Forgot Password?</Text>
                                    </View>
                                </TouchableOpacity>
                                <ActivityIndicator
                                    animating = {this.state.loading}
                                    color='#111'
                                    size = 'large'></ActivityIndicator>
                            </View>
                        <View style={styles.container} />
                    </View>
            </TouchableWithoutFeedback>
        );
    }
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  background: {
      backgroundColor: '#350863'
  },
  inputWrap:{
      flexDirection: "row",
      marginVertical: 10,
      height: 40,
      backgroundColor:"transparent"
  },
  input:{
      flex : 1,
      paddingHorizontal: 10,
      backgroundColor: "#FFF"
  },
  wrapper:{
      paddingHorizontal: 15
  },
  iconWrap:{
      paddingHorizontal: 7,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#ffffff"
  },
  icon:{
      width: 20,
      height: 20
  },
  button:{
      backgroundColor: "#ffffff",
      paddingVertical: 15,
      marginVertical: 15,
      alignItems: "center",
      justifyContent: "center"
  },
  buttonText:{
      color:"#0d0d0d",
      fontSize: 18

  },
  signUp: {
      color:"#FFF",
      backgroundColor:"transparent",
      textAlign: "center"
  }
});

function mapDispatchToProps(dispatch) {
    return bindActionCreators(ActionCreators, dispatch)
}

function mapStateToProps(state) {
    return {
        userId: state.userId,
        email: state.email,
        displayName: state.displayName,
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(Login)