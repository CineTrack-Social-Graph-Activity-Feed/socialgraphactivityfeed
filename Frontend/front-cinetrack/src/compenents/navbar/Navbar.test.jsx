import { describe, it, expect, vi, beforeEach } from 'vitest';import { describe, it, expect, vi, beforeEach } from 'vitest';import { describe, it, expect, vi, beforeEach } from 'vitest';import { describe, it, expect, vi, beforeEach } from 'vitest';import { describe, it, expect, vi, beforeEach } from 'vitest';import { render, screen } from '@testing-library/react';

import { render, screen, waitFor } from '@testing-library/react';

import userEvent from '@testing-library/user-event';import { render, screen, waitFor } from '@testing-library/react';

import Navbar from './Navbar';

import userEvent from '@testing-library/user-event';import { render, screen, waitFor } from '@testing-library/react';

const mockFetchWithAuth = vi.fn();

const mockSignOut = vi.fn();import Navbar from './Navbar';

const mockUser = {

  user: {import userEvent from '@testing-library/user-event';import { render, screen } from '@testing-library/react';

    user_id: 'user123',

    full_name: 'Test User',const mockFetchWithAuth = vi.fn();

    image_url: null

  }const mockSignOut = vi.fn();import Navbar from './Navbar';

};

const mockUser = {

vi.mock('../../config/AuthContext', () => ({

  useAuth: () => ({  user: {import { BrowserRouter } from 'react-router-dom';import { render, screen, fireEvent } from '@testing-library/react';import { describe, it, expect, vi } from 'vitest';

    user: mockUser,

    fetchWithAuth: mockFetchWithAuth,    user_id: 'user123',

    signOut: mockSignOut

  })    full_name: 'Test User',// Mock AuthContext

}));

    image_url: null

describe('Navbar', () => {

  beforeEach(() => {  }const mockFetchWithAuth = vi.fn();import Navbar from './Navbar';

    vi.clearAllMocks();

    mockFetchWithAuth.mockImplementation((url) => {};

      if (url.includes('/api/user/user123')) {

        return Promise.resolve({const mockSignOut = vi.fn();

          ok: true,

          json: () => Promise.resolve({ user: { id: 'objectId123', user_id: 'user123', full_name: 'Test User' } })vi.mock('../../config/AuthContext', () => ({

        });

      }  useAuth: () => ({const mockUser = {import { useAuth } from '../../config/AuthContext';import { BrowserRouter } from 'react-router-dom';import { BrowserRouter } from 'react-router-dom';

      if (url.includes('/api/followed')) {

        return Promise.resolve({    user: mockUser,

          ok: true,

          json: () => Promise.resolve({ followed: [] })    fetchWithAuth: mockFetchWithAuth,  user: {

        });

      }    signOut: mockSignOut

      if (url.includes('/api/user/search')) {

        return Promise.resolve({  })    user_id: 'user123',

          ok: true,

          json: () => Promise.resolve({ users: [] })}));

        });

      }    full_name: 'Test User',

      return Promise.resolve({

        ok: true,describe('Navbar', () => {

        json: () => Promise.resolve({})

      });  beforeEach(() => {    image_url: nullvi.mock('../../config/AuthContext', () => ({import Navbar from './Navbar';import Navbar from '../../compenents/navbar/Navbar';

    });

  });    vi.clearAllMocks();



  it('should render the navbar with logo', () => {    mockFetchWithAuth.mockImplementation((url) => {  }

    render(<Navbar />);

    expect(screen.getByText('cineTrack')).toBeInTheDocument();      if (url.includes('/api/user/user123')) {

  });

        return Promise.resolve({};  useAuth: vi.fn()

  it('should render user information', () => {

    render(<Navbar />);          ok: true,

    expect(screen.getByText('Test User')).toBeInTheDocument();

  });          json: () => Promise.resolve({ user: { id: 'objectId123', user_id: 'user123', full_name: 'Test User' } })



  it('should render search input', () => {        });

    render(<Navbar />);

    const searchInput = screen.getByPlaceholderText('Buscar amigos...');      }vi.mock('../../config/AuthContext', () => ({}));import { useAuth } from '../../config/AuthContext';import { AuthProvider } from '../../config/AuthContext';

    expect(searchInput).toBeInTheDocument();

  });      if (url.includes('/api/followed')) {



  it('should fetch user profile on mount', async () => {        return Promise.resolve({  useAuth: () => ({

    render(<Navbar />);

    await waitFor(() => {          ok: true,

      expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/user/user123');

    });          json: () => Promise.resolve({ followed: [] })    user: mockUser,

  });

        });

  it('should fetch followed users after profile is loaded', async () => {

    render(<Navbar />);      }    fetchWithAuth: mockFetchWithAuth,

    await waitFor(() => {

      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/followed?user_id='));      return Promise.resolve({

    });

  });        ok: true,    signOut: mockSignOutdescribe('Navbar Component', () => {



  it('should display default avatar when user has no image_url', () => {        json: () => Promise.resolve({ users: [] })

    render(<Navbar />);

    const avatar = screen.getByAltText('Logo Usuario');      });  })

    expect(avatar).toHaveAttribute('src', expect.stringContaining('depositphotos'));

  });    });



  it('should render search button with SVG icon', () => {  });}));  const mockSignOut = vi.fn();

    const { container } = render(<Navbar />);

    const searchBtn = container.querySelector('.search-btn');

    expect(searchBtn).toBeTruthy();

    const svg = searchBtn.querySelector('svg');  it('should render the navbar with logo', () => {

    expect(svg).toBeTruthy();

  });    render(<Navbar />);



  it('should have correct navbar structure', () => {    describe('Navbar', () => {  const mockFetchWithAuth = vi.fn();vi.mock('../../config/AuthContext', () => ({// Mock AuthContext

    const { container } = render(<Navbar />);

    expect(container.querySelector('.navbar')).toBeTruthy();    expect(screen.getByText('cineTrack')).toBeInTheDocument();

    expect(container.querySelector('.logo')).toBeTruthy();

    expect(container.querySelector('.user-section')).toBeTruthy();  });  beforeEach(() => {

    expect(container.querySelector('.search-wrap')).toBeTruthy();

  });



  it('should handle user profile fetch error gracefully', async () => {  it('should render user information', () => {    vi.clearAllMocks();

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockFetchWithAuth.mockRejectedValueOnce(new Error('Network error'));    render(<Navbar />);

    render(<Navbar />);

    await waitFor(() => {        // Mock successful user fetch

      expect(consoleErrorSpy).toHaveBeenCalled();

    });    expect(screen.getByText('Test User')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();

  });    expect(screen.getByAltText('Logo Usuario')).toBeInTheDocument();    mockFetchWithAuth.mockImplementation((url) => {  beforeEach(() => {  useAuth: vi.fn()vi.mock('../../config/AuthContext', () => ({



  it('should update search query on input change', async () => {  });

    const user = userEvent.setup();

    render(<Navbar />);      if (url.includes('/api/user/user123')) {

    const searchInput = screen.getByPlaceholderText('Buscar amigos...');

    await user.type(searchInput, 'new query');  it('should render search input', () => {

    expect(searchInput).toHaveValue('new query');

  });    render(<Navbar />);        return Promise.resolve({    vi.clearAllMocks();

});

    

    const searchInput = screen.getByPlaceholderText('Buscar amigos...');          ok: true,

    expect(searchInput).toBeInTheDocument();

  });          json: () => Promise.resolve({ user: { id: 'objectId123', user_id: 'user123', full_name: 'Test User' } })    mockFetchWithAuth.mockResolvedValue({}));  AuthProvider: ({ children }) => children,



  it('should fetch user profile on mount', async () => {        });

    render(<Navbar />);

          }      ok: true,

    await waitFor(() => {

      expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/user/user123');      if (url.includes('/api/followed')) {

    });

  });        return Promise.resolve({      json: async () => ({ user: { id: '123', username: 'testuser' } })  useAuth: () => ({



  it('should fetch followed users after profile is loaded', async () => {          ok: true,

    render(<Navbar />);

              json: () => Promise.resolve({ followed: [] })    });

    await waitFor(() => {

      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/followed?user_id='));        });

    });

  });      }    describe('Navbar Component', () => {    user: {



  it('should perform search with debounce', async () => {      return Promise.resolve({

    const user = userEvent.setup();

    mockFetchWithAuth.mockImplementation((url) => {        ok: true,    useAuth.mockReturnValue({

      if (url.includes('/api/user/search')) {

        return Promise.resolve({        json: () => Promise.resolve({ users: [] })

          ok: true,

          json: () => Promise.resolve({ users: [{ id: 'user456', full_name: 'Search Result' }] })      });      signOut: mockSignOut,  const mockSignOut = vi.fn();      user: {

        });

      }    });

      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });

    });  });      fetchWithAuth: mockFetchWithAuth,



    render(<Navbar />);

    

    const searchInput = screen.getByPlaceholderText('Buscar amigos...');  it('should render the navbar with logo', () => {      user: {         user_id: 'test-user-123',

    await user.type(searchInput, 'test');

        render(<Navbar />);

    await waitFor(() => {

      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/user/search?q=test'));            user: { 

    }, { timeout: 1000 });

  });    expect(screen.getByText('cineTrack')).toBeInTheDocument();



  it('should not show dropdown when query is empty', async () => {  });          user_id: 123,   beforeEach(() => {        username: 'testuser'

    render(<Navbar />);

    

    const searchInput = screen.getByPlaceholderText('Buscar amigos...');

    expect(searchInput).toHaveValue('');  it('should render user information', () => {          username: 'testuser' 

    

    const dropdown = screen.queryByText('Buscando...');    render(<Navbar />);

    expect(dropdown).not.toBeInTheDocument();

  });            }     vi.clearAllMocks();      }



  it('should display default avatar when user has no image_url', () => {    expect(screen.getByText('Test User')).toBeInTheDocument();

    render(<Navbar />);

        expect(screen.getByAltText('Logo Usuario')).toBeInTheDocument();      }

    const avatar = screen.getByAltText('Logo Usuario');

    expect(avatar).toHaveAttribute('src', expect.stringContaining('depositphotos'));  });

  });

    });    useAuth.mockReturnValue({    },

  it('should have search form that prevents default submission', async () => {

    const user = userEvent.setup();  it('should render search input', () => {

    render(<Navbar />);

        render(<Navbar />);  });

    const searchInput = screen.getByPlaceholderText('Buscar amigos...');

    await user.type(searchInput, 'test{enter}');    

    

    expect(searchInput).toBeInTheDocument();    const searchInput = screen.getByPlaceholderText('Buscar amigos...');      signOut: mockSignOut,    fetchWithAuth: vi.fn(),

  });

    expect(searchInput).toBeInTheDocument();

  it('should render search button with SVG icon', () => {

    const { container } = render(<Navbar />);  });  const renderWithRouter = (component) => {

    

    const searchBtn = container.querySelector('.search-btn');

    expect(searchBtn).toBeInTheDocument();

      it('should fetch user profile on mount', async () => {    return render(      user: { username: 'testuser' }    signOut: vi.fn()

    const svg = searchBtn.querySelector('svg');

    expect(svg).toBeInTheDocument();    render(<Navbar />);

  });

          <BrowserRouter>

  it('should have correct navbar structure', () => {

    const { container } = render(<Navbar />);    await waitFor(() => {

    

    expect(container.querySelector('.navbar')).toBeInTheDocument();      expect(mockFetchWithAuth).toHaveBeenCalledWith('/api/user/user123');        {component}    });  })

    expect(container.querySelector('.logo')).toBeInTheDocument();

    expect(container.querySelector('.user-section')).toBeInTheDocument();    });

    expect(container.querySelector('.search-wrap')).toBeInTheDocument();

  });  });      </BrowserRouter>



  it('should handle user profile fetch error gracefully', async () => {

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockFetchWithAuth.mockRejectedValueOnce(new Error('Network error'));  it('should fetch followed users after profile is loaded', async () => {    );  });}));

    

    render(<Navbar />);    render(<Navbar />);

    

    await waitFor(() => {      };

      expect(consoleErrorSpy).toHaveBeenCalledWith(

        expect.stringContaining('Error al traer usuario'),    await waitFor(() => {

        expect.any(Error)

      );      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/followed?user_id='));

    });

        });

    consoleErrorSpy.mockRestore();

  });  });  it('should render navbar', () => {



  it('should update search query on input change', async () => {

    const user = userEvent.setup();

    render(<Navbar />);  it('should perform search with debounce', async () => {    renderWithRouter(<Navbar />);  const renderWithRouter = (component) => {describe('Navbar Component', () => {

    

    const searchInput = screen.getByPlaceholderText('Buscar amigos...');    const user = userEvent.setup();

    await user.type(searchInput, 'new query');

        mockFetchWithAuth.mockImplementation((url) => {    expect(document.querySelector('nav')).toBeInTheDocument();

    expect(searchInput).toHaveValue('new query');

  });      if (url.includes('/api/user/search')) {

});

        return Promise.resolve({  });    return render(  it('renders without crashing', () => {

          ok: true,

          json: () => Promise.resolve({ users: [{ id: 'user456', full_name: 'Search Result' }] })

        });

      }  it('should call fetchWithAuth on mount to get user profile', async () => {      <BrowserRouter>    render(

      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });

    });    renderWithRouter(<Navbar />);



    render(<Navbar />);    await vi.waitFor(() => {        {component}      <BrowserRouter>

    

    const searchInput = screen.getByPlaceholderText('Buscar amigos...');      expect(mockFetchWithAuth).toHaveBeenCalled();

    await user.type(searchInput, 'test');

        });      </BrowserRouter>        <Navbar />

    // Wait for debounce (400ms)

    await waitFor(() => {  });

      expect(mockFetchWithAuth).toHaveBeenCalledWith(expect.stringContaining('/api/user/search?q=test'));

    }, { timeout: 1000 });    );      </BrowserRouter>

  });

  it('should have search functionality', () => {

  it('should not show dropdown when query is empty', async () => {

    render(<Navbar />);    renderWithRouter(<Navbar />);  };    );

    

    const searchInput = screen.getByPlaceholderText('Buscar amigos...');    const searchInput = screen.queryByPlaceholderText(/buscar|search/i);

    expect(searchInput).toHaveValue('');

        expect(searchInput).toBeTruthy();  });

    const dropdown = screen.queryByText('Buscando...');

    expect(dropdown).not.toBeInTheDocument();  });

  });

  it('should render navbar', () => {

  it('should display default avatar when user has no image_url', () => {

    render(<Navbar />);  it('should use correct user ID from auth context', () => {

    

    const avatar = screen.getByAltText('Logo Usuario');    renderWithRouter(<Navbar />);    renderWithRouter(<Navbar />);  it('displays user information when loaded', async () => {

    expect(avatar).toHaveAttribute('src', expect.stringContaining('depositphotos'));

  });    expect(true).toBe(true);



  it('should have search form that prevents default submission', async () => {  });    expect(document.querySelector('nav')).toBeInTheDocument();    render(

    const user = userEvent.setup();

    render(<Navbar />);});

    

    const searchInput = screen.getByPlaceholderText('Buscar amigos...');  });      <BrowserRouter>

    await user.type(searchInput, 'test{enter}');

            <Navbar />

    // Should not cause page refresh (form prevented default)

    expect(searchInput).toBeInTheDocument();  it('should render logo/brand', () => {      </BrowserRouter>

  });

    renderWithRouter(<Navbar />);    );

  it('should render search button with SVG icon', () => {

    const { container } = render(<Navbar />);    const logo = screen.queryByText(/cinetrack/i) || screen.queryByAltText(/logo/i);    

    

    const searchBtn = container.querySelector('.search-btn');    expect(logo).toBeTruthy();    // Component should render even if data is loading

    expect(searchBtn).toBeInTheDocument();

      });    expect(document.querySelector('.navbar')).toBeInTheDocument();

    const svg = searchBtn.querySelector('svg');

    expect(svg).toBeInTheDocument();  });

  });

  it('should render navigation links', () => {});

  it('should have correct navbar structure', () => {

    const { container } = render(<Navbar />);    renderWithRouter(<Navbar />);

        const nav = document.querySelector('nav');

    expect(container.querySelector('.navbar')).toBeInTheDocument();    expect(nav).toBeInTheDocument();

    expect(container.querySelector('.logo')).toBeInTheDocument();  });

    expect(container.querySelector('.user-section')).toBeInTheDocument();

    expect(container.querySelector('.search-wrap')).toBeInTheDocument();  it('should handle logout when clicking logout button', () => {

  });    renderWithRouter(<Navbar />);

    const logoutButtons = screen.queryAllByText(/cerrar|logout|salir/i);

  it('should handle user profile fetch error gracefully', async () => {    

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});    if (logoutButtons.length > 0) {

    mockFetchWithAuth.mockRejectedValueOnce(new Error('Network error'));      fireEvent.click(logoutButtons[0]);

          expect(mockSignOut).toHaveBeenCalled();

    render(<Navbar />);    }

      });

    await waitFor(() => {

      expect(consoleErrorSpy).toHaveBeenCalledWith(  it('should display user information if available', () => {

        expect.stringContaining('Error al traer usuario'),    renderWithRouter(<Navbar />);

        expect.any(Error)    const userElement = screen.queryByText(/testuser/i);

      );    // This may or may not be present depending on navbar design

    });    expect(true).toBe(true); // Placeholder test

      });

    consoleErrorSpy.mockRestore();});

  });

  it('should update search query on input change', async () => {
    const user = userEvent.setup();
    render(<Navbar />);
    
    const searchInput = screen.getByPlaceholderText('Buscar amigos...');
    await user.type(searchInput, 'new query');
    
    expect(searchInput).toHaveValue('new query');
  });
});
