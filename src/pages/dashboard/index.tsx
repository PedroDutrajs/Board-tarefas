import { GetServerSideProps } from 'next';
import styles from './styles.module.css'
import Head from 'next/head';
import { getSession } from 'next-auth/react';
import { Textarea } from '@/components/textarea';
import {FiShare2} from 'react-icons/fi'
import {FaTrash} from 'react-icons/fa'
import { ChangeEvent, FormEvent, useState, useEffect } from 'react';
import { db } from '@/services/firebaseConn';
import {collection, addDoc, query, orderBy, where, onSnapshot} from 'firebase/firestore'

interface DashboardProps{
    user: {
        email: string
    }
}

interface TaskProps{
    id: string;
    tarefa: string;
    created: Date;
    user: string;
    public: boolean
}
export default function Dashboard({user}: DashboardProps){
    const [input, setInput] = useState('')
    const [publicTask, setPublicTask] = useState(false)
    const [tasks, setTasks] = useState<TaskProps[]>([])

    useEffect(() => {
        async function getTasks(){
            const taskRef = collection(db, 'tarefas')
            const q = query(
                taskRef,
                orderBy('created', 'desc'),
                where('user', '==', user?.email)
            )

            onSnapshot(q, (snapshot) => {
                let lista = [] as TaskProps[]

                snapshot.forEach((doc) => {
                    lista.push({
                        id: doc.id,
                        tarefa: doc.data().tarefa,
                        created: doc.data().created,
                        user: doc.data().user,
                        public: doc.data().public
                    })
                })
                setTasks(lista)
            })
        }
        getTasks()
    }, [ user?.email])

    function handleChangePublic(e:ChangeEvent<HTMLInputElement>){
        console.log(e.target.checked)
        setPublicTask(e.target.checked)
    }

   async function handleRegisterTask(e: FormEvent){
        e.preventDefault()

        if(input === '') return

        try{
            await addDoc(collection(db, 'tarefas'), {
                tarefa: input,
                created: new Date(),
                user: user?.email,
                public: publicTask
            })

            setInput('')
            setPublicTask(false)

        }catch(err){
            console.log(err)
        }
    }


    return(
        <div>
           <Head>
                <title>Meu painel de tarefas</title>
           </Head>

           <main className={styles.container}>
                <section className={styles.content}>
                    <div className={styles.contentForm}>
                        <h1 className={styles.title}>Qual sua tarefa?</h1>
                        <form onSubmit={handleRegisterTask}>
                            <Textarea
                                placeholder='Digite qual sua tarefa...'  
                                value={input}     
                                onChange={(e:ChangeEvent<HTMLTextAreaElement>) =>
                                 setInput(e.target.value)}                     
                            />
                            <div className={styles.checkboxArea}>
                                <input type="checkbox"
                                 className={styles.checkbox}
                                 checked={publicTask}
                                 onChange={handleChangePublic}
                                 />
                                    <label>Deixar tarefa pública?</label>
                            </div>
                            
                            <button type='submit' className={styles.button}>Registrar</button>
                        </form>
                    </div>
                </section>

                <section className={styles.taskContainer}>
                    <h1>Minhas tarefas</h1>

                    {tasks.map((item) => (
                    <article key={item.id} className={styles.task}>
                           {item.public && (
                             <div className={styles.tagContainer}>
                             <label className={styles.tag}>PÚBLICO</label>
                             <button className={styles.shareButton}>
                                 <FiShare2
                                     size={22}
                                     color='#3183ff'
                                 />
                             </button>
                            </div>
                           )}
                            
                            <div className={styles.taskContent}>
                                <p>{item.tarefa}</p>
                                <button className={styles.trashButton}>
                                    <FaTrash size={24} color='#ea3140'/>
                                </button>
                            </div>
                    </article>
                    ))}

                    
                </section>
           </main>
        </div>
    )
}

export const getServerSideProps: GetServerSideProps = async ({req}) => {
    
    const session = await getSession({req})
    console.log(session)

    if(!session?.user){
        return{
            redirect:{
                destination: '/',
                permanent: false
            }
        }
    }

    return{
        props: {
            user:{
                email: session?.user?.email

            }
        }
    }
}
