import { Player, IPlayer } from "./models/Player.model.js";

export interface CreatePlayerDTO {
  name: string;
  imageUrl?: string;
  role: "wk" | "bat" | "ar" | "bowl";
}

export interface UpdatePlayerDTO {
  name?: string;
  imageUrl?: string;
  role?: "wk" | "bat" | "ar" | "bowl";
}

export class PlayerService {
  async createPlayer(data: CreatePlayerDTO): Promise<IPlayer> {
    const player = new Player({
      name: data.name,
      imageUrl: data.imageUrl,
      role: data.role,
    });

    return await player.save();
  }

  async updatePlayer(playerId: string, data: UpdatePlayerDTO): Promise<IPlayer> {
    const player = await Player.findByIdAndUpdate(playerId, data, {
      new: true,
      runValidators: true,
    });

    if (!player) {
      throw new Error("Player not found");
    }

    return player;
  }

  async deletePlayer(playerId: string): Promise<void> {
    const result = await Player.findByIdAndDelete(playerId);
    if (!result) {
      throw new Error("Player not found");
    }
  }

  async getPlayerById(playerId: string): Promise<IPlayer | null> {
    return await Player.findById(playerId);
  }

  async getAllPlayers(search?: string, page: number = 1, limit: number = 50): Promise<any> {
    const filter: any = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const [players, total] = await Promise.all([
      Player.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Player.countDocuments(filter),
    ]);

    return {
      players,
      total,
      page,
      limit,
    };
  }
}

export const playerService = new PlayerService();
