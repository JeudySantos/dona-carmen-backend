       // Carrito de compras
        //let cart = [];
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
         updateCart();
        
        // Precios de envio por zona
        const shippingPrices = {
            '1': 250, // Los Guandules Centro
            '2': 300, // Los Guandules Norte
            '3': 400, // Los Guandules Sur
            '4': 500, // Zona Colonial
            '5': 500  // Otra zona
        };
        
        // Precios de productos
        const products = {
            '1': { name: 'Biscocho de Chocolate', price: 250 },
            '2': { name: 'EDulce de Tres Leches', price: 300 },
            '3': { name: 'Flan', price: 400 },
            '4': { name: 'Alfajores', price: 400 },
            '5': { name: 'Donas', price: 200 },
            '6': { name: 'Panelitas', price: 500 }
        };
        
        // Añadir al carrito
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                const product = products[productId];
                
                // Verificar si el producto ya esta en el carrito
                const existingItem = cart.find(item => item.id === productId);
                
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    cart.push({
                        id: productId,
                        name: product.name,
                        price: product.price,
                        quantity: 1
                    });
                }
                
                updateCart();
                localStorage.setItem('cart', JSON.stringify(cart));
                mostrarRecomendaciones();
            });
        });
        
        // Actualizar carrito
        function updateCart() {
            const cartItems = document.getElementById('cart-items');
            const subtotalElement = document.getElementById('subtotal');
            const shippingElement = document.getElementById('shipping');
            const totalElement = document.getElementById('total');
            
            if (cart.length === 0) {
                cartItems.innerHTML = '<p class="text-muted">Tu carrito está vacío</p>';
                subtotalElement.textContent = '$0.00';
                shippingElement.textContent = '$0.00';
                totalElement.textContent = '$0.00';
                return;
            }
            
            let html = '';
            let subtotal = 0;

        
            cart.forEach(item => {
                subtotal += item.price * item.quantity;
                html += `
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <span class="fw-bold">${item.name}</span>
                            <br>
                            <small class="text-muted">${item.quantity} x $${item.price.toFixed(2)}</small>
                        </div>
                        <div>
                            <span>$${(item.price * item.quantity).toFixed(2)}</span>
                            <button class="btn btn-sm btn-outline-danger ms-2 remove-item" data-id="${item.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            cartItems.innerHTML = html;
            subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
            
            // Calcular envio
            const zoneSelect = document.getElementById('zone');
            let shipping = 0;
            
            if (zoneSelect.value) {
                shipping = shippingPrices[zoneSelect.value];
            }
            
            shippingElement.textContent = `$${shipping.toFixed(2)}`;
            totalElement.textContent = `$${(subtotal + shipping).toFixed(2)}`;
            
            // Añadir eventos a los botones de eliminar
            document.querySelectorAll('.remove-item').forEach(button => {
                button.addEventListener('click', function() {
                    const productId = this.getAttribute('data-id');
                    cart = cart.filter(item => item.id !== productId);
                    updateCart();
                    localStorage.setItem('cart', JSON.stringify(cart));//
                    
                });
            });
           
        }
        
        // Calcular envio cuando cambia la zona
        document.getElementById('zone').addEventListener('change', updateCart);
        
        // Enviar pedido
        document.getElementById('order-form').addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (cart.length === 0) {
                alert('Por favor añade productos a tu carrito antes de enviar el pedido.');
                return;
            }
            
            // Generar numero de pedido aleatorio
            const orderNumber = 'DC-' + Math.floor(10000 + Math.random() * 90000);
            document.getElementById('order-number').textContent = orderNumber;
            
            // Muestra el  modal de confirmacion
            const modal = new bootstrap.Modal(document.getElementById('orderModal'));
            modal.show();
            
			// Crear el objeto pedido
			const pedido = {
				orderNumber,
				customer: {
					name: document.getElementById('name').value,
					phone: document.getElementById('phone').value,
					address: document.getElementById('address').value,
					zone: document.getElementById('zone').value,
					notes: document.getElementById('notes').value
				},
				items: cart,
				subtotal: parseFloat(document.getElementById('subtotal').textContent.replace('$', '')),
				shipping: parseFloat(document.getElementById('shipping').textContent.replace('$', '')),
				total: parseFloat(document.getElementById('total').textContent.replace('$', ''))
			};

			// ENVÍA el pedido al servidor
			fetch('https://dona-carmen-backend.onrender.com/api/pedidos', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(pedido)
			})
			.then(response => response.json())
			.then(data => {
				console.log('Pedido guardado en el servidor:', data);
			})
			.catch(error => {
				console.error('Error al enviar pedido:', error);
			});

            
            // Limpiar carrito y formulario
            cart = [];
            updateCart();
            localStorage.removeItem('cart'); // 
            this.reset();
        });
        
		document.getElementById('track-form').addEventListener('submit', function(e) {
			e.preventDefault();
			const orderId = document.getElementById('order-id').value;

			fetch(`https://dona-carmen-backend.onrender.com/api/pedidos/${orderId}`)
				.then(response => {
					if (!response.ok) {
						throw new Error('Pedido no encontrado');
					}
					return response.json();
				})
				.then(data => {
					// Estado simulado aleatorio
					const estados = ['En preparación', 'En camino', 'Entregado'];
					const estadoActual = estados[Math.floor(Math.random() * estados.length)];

					// Mostrar información del pedido + estado
					const resultDiv = document.getElementById('tracking-result');
					resultDiv.innerHTML = `
						<h5>Pedido encontrado</h5>
						<p><strong>Cliente:</strong> ${data.customerName}</p>
						<p><strong>Teléfono:</strong> ${data.customerPhone}</p>
						<p><strong>Total:</strong> $${data.total}</p>
						<p><strong>Estado:</strong> ${estadoActual}</p>
					`;
					resultDiv.style.display = 'block';
				})
				.catch(error => {
					// Mostrar mensaje de error
					const resultDiv = document.getElementById('tracking-result');
					resultDiv.innerHTML = `<p class="text-danger">Pedido no encontrado</p>`;
					resultDiv.style.display = 'block';
				});
		});
  
      
        // Chatbot
        const chatbotButton = document.getElementById('chatbot-button');
        const chatbotWindow = document.getElementById('chatbot-window');
        const chatbotClose = document.getElementById('chatbot-close');
        const chatbotForm = document.getElementById('chatbot-form');
        const chatbotInput = document.getElementById('chatbot-input');
        const chatbotMessages = document.getElementById('chatbot-messages');
        
        // Mostrar / Ocultar chatbot
        chatbotButton.addEventListener('click', () => {
            const isVisible = chatbotWindow.style.display === 'flex';
            
            if (isVisible) {
              chatbotWindow.style.display = 'none';
            } else {
              chatbotWindow.style.display = 'flex';
              chatbotMessages.innerHTML = '¡Hola! ¿En qué puedo ayudarte hoy?';
            }
          });
        // Procesar el mensaje del usuario
        chatbotForm.addEventListener('submit', function (e) {
          e.preventDefault();
        
          const userMessage = chatbotInput.value.trim();
          if (!userMessage) return;
        
          appendMessage('user', userMessage);
          chatbotInput.value = '';
          appendMessage('bot', 'Escribiendo...');
        
          setTimeout(() => {
            removeTyping();
            const botResponse = getBotResponse(userMessage.toLowerCase());
            appendMessage('bot', botResponse);
          }, 800); // Simula tiempo de respuesta
        });
        
        // Respuestas predeterminada
        function getBotResponse(message) {
          if (message.includes('hola') || message.includes('buenas')) {
            return '¡Hola! ¿En qué puedo ayudarte hoy?';
          } else if (message.includes('precio') || message.includes('cuánto cuesta')) {
            return 'Nuestros precios varían según el producto. Puedes verlos en la sección "Menú". ';
          } else if (message.includes('envío') || message.includes('delivery') || message.includes('envio') ) {
            return 'Hacemos entregas en varias zonas. Consulta la sección "Pedido" para más detalles. ';
          } else if (message.includes('pago') || message.includes('transferencia')) {
            return 'Aceptamos pagos por transferencia y pago móvil. ¡Escanea el QR en la sección "Pedido"! ';
          } else if (message.includes('gracias')) {
            return '¡Con gusto! Estamos para servirte. ';
          } else {
            return 'Lo siento, no entendí tu mensaje. ¿Puedes repetirlo? ';
          }
        }
          // Mostrar mensaje
        function appendMessage(sender, text) {
        const div = document.createElement('div');
        div.className = sender === 'user' ? 'user-message' : 'bot-message';
        div.textContent = text;
        chatbotMessages.appendChild(div);
         chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
        }
  
    
       // Eliminar "Escribiendo..."
       function removeTyping() {
        document.querySelectorAll('.bot-message').forEach(msg => {
        if (msg.textContent === 'Escribiendo...') msg.remove();
        });

         }
         // Mostrar recomendaciones de Produtos.
         function mostrarRecomendaciones() {
          let recomendaciones = [];
          const idsEnCarrito = cart.map(item => item.id);
      
          // Regla 1: Biscocho sin Flan
          if (idsEnCarrito.includes('1') && !idsEnCarrito.includes('3')) {
              recomendaciones.push('¿Ya probaste nuestro <strong>Flan</strong>? ¡Combina perfecto con el Biscocho!');
          }
      
          // Regla 2: Todo económico
          const carritoBarato = cart.every(item => item.price < 300);
          if (carritoBarato && !idsEnCarrito.includes('5')) {
              recomendaciones.push('¿Te animas con unas <strong>Donas</strong>? ¡Son económicas y deliciosas!');
          }
      
          // Regla 3: Flan y Tres Leches → sugiere Alfajores
          if (idsEnCarrito.includes('2') && idsEnCarrito.includes('3') && !idsEnCarrito.includes('4')) {
              recomendaciones.push('¿Por qué no pruebas nuestros <strong>Alfajores</strong>? Son el complemento perfecto a los postres cremosos.');
          }
      
          // Regla 4: Solo Panelitas → sugiere Donas
          if (cart.length === 1 && idsEnCarrito.includes('6') && !idsEnCarrito.includes('5')) {
              recomendaciones.push('¿Quieres un balance? Agrega unas <strong>Donas</strong> junto a tus Panelitas.');
          }
      
          // Regla 5: Combo variado → sugiere otro producto que aún no esté
          const sugerenciasAlternativas = [
              { id: '4', nombre: 'Alfajores' },
              { id: '5', nombre: 'Donas' },
              { id: '3', nombre: 'Flan' }
          ];
          if (cart.length >= 2) {
              for (const sugerencia of sugerenciasAlternativas) {
                  if (!idsEnCarrito.includes(sugerencia.id)) {
                      recomendaciones.push(`¿Quieres un postre adicional? Prueba nuestros <strong>${sugerencia.nombre}</strong>.`);
                      break; // solo muestra una sugerencia
                  }
              }
          }
      
          // Mostrar recomendaciones si hay
          if (recomendaciones.length > 0) {
              mostrarAlertaFlotante(recomendaciones.join('<br>'));
          }
      }
           
         function mostrarAlertaFlotante(mensaje) {
          const alerta = document.getElementById('floating-alert');
          const texto = document.getElementById('floating-alert-text');
          
          texto.innerHTML = mensaje;
          alerta.style.display = 'block';
      
          setTimeout(() => {
              alerta.style.display = 'none';
          }, 5000);
      }
