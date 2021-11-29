import socketio, { Socket } from "socket.io";
import { MessageType, WAConnection, WAConnectionState } from "@adiwajshing/baileys";
import fs from "fs";

import ora from "ora";
import chalk from "chalk";

type UserWspStatus = {
  userID: string;
  socketID: string;
  state: WAConnectionState;
  wsp: WAConnection;
};

export let UsersWspStates: UserWspStatus[] = [];

const findUser = (UserID: string) => {
  const user = UsersWspStates.find((user) => user.userID === UserID);
  return user;
};

export function WhatsappControllers(
  socket: Socket,
  io: socketio.Server,
  userID: string
) {
  const SocketIO = socket;
  const spinner = ora();
  let WhatsAppConn: WAConnection = new WAConnection();
  WhatsAppConn.version = [2, 2140, 12];
  WhatsAppConn.connectOptions.logQR = false;
  WhatsAppConn.browserDescription[0] = "Gestor de mensajeria";
  const WspUser: UserWspStatus = {
    userID,
    socketID: socket.id,
    state: WhatsAppConn.state,
    wsp: WhatsAppConn,
  };

  !UsersWspStates.some((wsp) => wsp.userID === userID) &&
    UsersWspStates.push(WspUser);
  /* cambiando el id del socket a medida que el usuario se reconecte */
  UsersWspStates = UsersWspStates.map((f) => {
    if (f.userID === userID) {
      return {
        ...f,
        socketID: socket.id,
      };
    }
    return f;
  });

  const connectWSP = async () => {
    spinner.info(
      `${chalk.blueBright("Iniciando conexion con wsp, enviando qr")}`
    );
    const user = findUser(userID);
    user?.wsp.on("qr", (qr) => io.to(socket.id).emit("wsp qr code", qr));

    user?.wsp.on("close", () => {
      const userIndex = UsersWspStates.findIndex((f) => f.userID === userID);
      UsersWspStates[userIndex].state = "close";
      const ws = new WAConnection();
      ws.version = [2, 2140, 12];
      WhatsAppConn.connectOptions.logQR = false;
      WhatsAppConn.browserDescription[0] = "Gestor de mensajeria";
      UsersWspStates[userIndex].wsp = ws;
      informWSPStatus(UsersWspStates[userIndex].userID);
    });
    await user?.wsp.connect();
    UsersWspStates[userIndex].state = user!.wsp.state;
    informWSPStatus(UsersWspStates[userIndex].userID);
    return user!.wsp;
  };

  const informWSPStatus = (userID: string) => {
    const user = findUser(userID);

    io.to(user!.socketID).emit("wspConnectionState", user!.state);
  };

  SocketIO.on("connectWsp", async () => {
    try {
      await connectWSP();
    } catch (error) {
      spinner.warn(`${chalk.redBright("Error al conectar wsp ")}`);
      console.log(error);
      const user = UsersWspStates.findIndex((f) => f.userID === userID);
      UsersWspStates[user].wsp.close();

      await connectWSP();
    }
  });

  const getChats = async (chats: any[]) => {
    try {
      const chatsArr: any[] = [];
      const userIndex = UsersWspStates.findIndex((f) => f.userID === userID);
      const UserWsp = UsersWspStates[userIndex].wsp;
      const user = findUser(userID);
      for await (const RequestChat of chats) {
        let messages = await UserWsp.loadMessages(
          `${RequestChat.cellphone}@s.whatsapp.net`,
          80
        );

        const profilePicture = await UserWsp.getProfilePicture(
          `${RequestChat.cellphone}@s.whatsapp.net`
        );
        for await (const [index, message] of messages.messages.entries()) {
          if (message.message?.audioMessage) {
            const buffer = await UserWsp.downloadMediaMessage(message);
            const m = { ...message, audioBuffer: buffer};
            messages.messages[index] = m as any;
          }
        }
        chatsArr.push({ profilePicture, name: RequestChat.name, ...messages });
      }
      io.to(user!.socketID).emit("get chats", chatsArr);
    } catch (error) {
      console.log("hubo un error al cargar los chats perro", error);
    }
  };

  SocketIO.on('send message', async text => {
    const userIndex = UsersWspStates.findIndex((f) => f.userID === userID);
    const UserWsp = UsersWspStates[userIndex].wsp;
    await UserWsp.sendMessage(text.jid, text.text, MessageType.text);
  })

  SocketIO.on("get selected chats", async (ChatsArr) => {
    await getChats(ChatsArr);
  });
  
  const userIndex = UsersWspStates.findIndex((f) => f.userID === userID);
  const User = UsersWspStates[userIndex];

  User.wsp.on('chat-update', async  chat => {
    if (chat.hasNewMessage) {
      // console.log(chat.messages?.first);
      io.to(User.socketID).emit('chat update', chat);
      const msj = chat.messages!.first
      if (!msj.key.fromMe) {
        // User.wsp.sendMessage(chat.jid, 'Hola, en que puedo ayudarte')
        if(chat.messages!.first.message!.conversation === 'Hola buenas tardes'){
          const respuesta = 'Hola, buenas tardes. En este momento nuestra gestora esta ocupada, elija una de estas opciones para que podamos acelerar su gestion';
          await User.wsp.sendMessage(chat.jid, respuesta, MessageType.text);
        }
      }
    }
  })
  informWSPStatus(UsersWspStates[userIndex].userID);

  return UsersWspStates[userIndex].wsp;
}
