import random
from diplomacy import Game
from diplomacy.utils.export import to_saved_game_format

# Creating a game
# Alternatively, a map_name can be specified as an argument. e.g. Game(map_name='pure')
game = Game()
while not game.is_game_done:

    # Getting the list of possible orders for all locations
    possible_orders = game.get_all_possible_orders()

    # For each power, randomly sampling a valid order
    for power_name, power in game.powers.items():
        power_orders = []
        for loc in game.get_orderable_locations(power_name):
            attacking_orders_for_loc = []
            hold_order_for_loc = None
            for order in possible_orders[loc]:
                if ' - ' in order and ' VIA' not in order: # Move order
                    attacking_orders_for_loc.append(order)
                elif ' - ' in order and ' VIA' in order: # Move via convoy order
                    attacking_orders_for_loc.append(order)
                elif ' B' in order and not (' S ' in order): # Build order
                    attacking_orders_for_loc.append(order)
                elif ' H' in order and not (' S ' in order): # Hold order
                    hold_order_for_loc = order

            if attacking_orders_for_loc:
                power_orders.append(random.choice(attacking_orders_for_loc))
            elif hold_order_for_loc:
                power_orders.append(hold_order_for_loc)
            else:
                power_orders.append('WAIVE')
        game.set_orders(power_name, power_orders)

    # Messages can be sent locally with game.add_message
    # e.g. game.add_message(Message(sender='FRANCE',
    #                               recipient='ENGLAND',
    #                               message='This is a message',
    #                               phase=self.get_current_phase(),
    #                               time_sent=int(time.time())))

    # Processing the game to move to the next phase
    game.process()

# Exporting the game to disk to visualize (game is appended to file)
# Alternatively, we can do >> file.write(json.dumps(to_saved_game_format(game)))
to_saved_game_format(game, output_path='game-attack.json')
