import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { createUser, ValidateUser, getUserProfile } from '../services/users.service';
import { loadContentMessage } from '../web-socket/services/chat.service';
import { Readable } from 'stream';

export class AuthController {
	constructor() {}

	async singIn(req: Request, res: Response) {
		const { username, password } = req.body;
		const user = ValidateUser(username, password);

		if (!user)
			return res
				.status(400)
				.json({ error: 'No existe usuario o contraseña invalida' });
		const validatePassword = () => {
			if (user.password !== password) return false;
			return true;
		};
		if (!validatePassword)
			return res
				.status(400)
				.json({ error: 'No existe usuario o contraseña invalida' });

		const token: string = jwt.sign(
			{ id: user.id, UserfullName: user.fullName },
			process.env.TOKEN_SECRET!,
			{
				expiresIn: '10 hrs'
			}
		);
		try {
			const ChatsExiste = fs.existsSync(
				path.join(
					__dirname,
					`../web-socket/controllers/chats/chat-history-${user.id}.json`
				)
			);
			if (!ChatsExiste) {
				console.log('No existe archivo de chat, voy a crearlo');
				fs.writeFileSync(
					path.join(
						__dirname,
						`../web-socket/controllers/chats/chat-history-${user.id}.json`
					),
					JSON.stringify({ chats: [], contacts: [] })
				);
			} else {
				console.log('Ya existe el archivo, no voy a crearlo');
			}
		} catch (error) {
			console.log(error);
		}
		res.json({
			token
		});
	}

	async userProfile(req: Request, res: Response) {
		const user = getUserProfile(req.userId);
		try {
			res.json({ fullName: user! });
		} catch (error) {
			console.log('Error al obtener el perfil de usuario');
			if (!user) return res.status(404).json('el usuario no existe');
		}
	}

	async DownloadMedia(req: Request, res: Response) {
		const m = req.body.message;
		// console.log(m);
		if (m !== undefined) {
			const buffer = await loadContentMessage(m);
			return res.json(buffer);
		}
		// fs.writeFileSync(
		//     path.join(
		//         __dirname,
		//         `../web-socket/controllers/chats/media/${m.key.id}.ogg`
		//     ),
		//     buffer
		// );
		// return res.json(buffer);
	}

	async test(req: Request, res: Response) {
		res.json({res: 'working'})
		console.log(req.params);
		// try {
		// 	res.set('content-type', 'audio/ogg');
		// 	const id = `${req.params.id}.ogg`;
		// 	const p = path.join(__dirname, `../web-socket/controllers/chats/media/${id}`);
		// 	const buffer = fs.readFileSync(p);
		// 	console.log(req.params);

		// 	return res.send(buffer);
		// } catch (error) {

		// 	console.log('no encontrado');
		// }
	}
}
