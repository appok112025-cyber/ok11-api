import { Player, IPlayer } from "./models/Player.model.js";

export interface CreatePlayerDTO {
  name: string;
}

export interface UpdatePlayerDTO {
  name?: string;
}

export class PlayerService {
  async createPlayer(data: CreatePlayerDTO): Promise<IPlayer> {
    const player = new Player({
      name: data.name,
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

  async getAllPlayers(search?: string): Promise<IPlayer[]> {
    const filter: any = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    return await Player.find(filter).sort({ name: 1 });
  }
}

export const playerService = new PlayerService();
